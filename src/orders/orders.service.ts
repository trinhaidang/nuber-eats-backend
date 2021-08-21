import { Inject, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Order, OrderStatus } from "./entities/order.entity";
import { Repository } from "typeorm";
import { CreateOrderInput, CreateOrderOutput } from "./dtos/create-order.dto";
import { User, UserRole } from "src/users/entities/user.entity";
import { Restaurant } from "src/restaurants/entities/restaurant.entity";
import { OrderItem } from "./entities/order-item.entity";
import { Dish } from "src/restaurants/entities/dish.entity";
import { GetOrdersInput, GetOrdersOutput } from "./dtos/get-orders.dto";
import { GetOrderInput, GetOrderOutput } from "./dtos/get-order.dto";
import { EditOrderInput, EditOrderOutput } from "./dtos/edit-order.dto";
import { NEW_COOKED_ORDER, NEW_ORDER_UPDATE, NEW_PENDING_ORDER, PUB_SUB } from "src/common/common.constants";
import { PubSub } from "graphql-subscriptions";
import { TakeOrderInput, TakeOrderOutput } from "./dtos/take-order.dto";
import { setItemPrice } from "src/common/utilities/service-utils";


@Injectable()
export class OrderService {

    constructor(
        @InjectRepository(Order)
        private readonly orders: Repository<Order>,
        @InjectRepository(OrderItem)
        private readonly orderItems: Repository<OrderItem>,
        @InjectRepository(Dish)
        private readonly dishes: Repository<Dish>,
        @InjectRepository(Restaurant)
        private readonly restaurants: Repository<Restaurant>,
        @Inject(PUB_SUB) private readonly pubSub: PubSub,
    ) { }

    flatDeep(array, level = 1) {
        return level > 0 ? array.reduce((acc, val) => acc.concat(Array.isArray(val) ? this.flatDeep(val, level - 1) : val), []) : array.slice();
    };

    checkOrderPrivilege(user: User, order: Order): boolean {
        let havePrivilege = false;
        if (user.role === UserRole.Client && order.customerId === user.id) {
            havePrivilege = true;
        }
        else if (user.role === UserRole.Delivery && order.driverId === user.id) {
            havePrivilege = true;
        }
        else if (user.role === UserRole.Owner && order.restaurant.ownerId === user.id) {
            havePrivilege = true;
        }

        return havePrivilege;
    }

    checkOrderStatusUpdatePrivilege2(role: UserRole, status: OrderStatus): boolean {
        let canUpdate = false;
        if (role === UserRole.Owner
            && (status === OrderStatus.Cooking || status === OrderStatus.Cooked)) {
            canUpdate = true;
        }
        if (role === UserRole.Delivery
            && (status === OrderStatus.PickedUp || status === OrderStatus.Delivered)) {
            canUpdate = true;
        }
        return canUpdate;
    }

    checkOrderStatusUpdatePrivilege(role: UserRole, status: OrderStatus): boolean {
        let canUpdate = true;
        if (role === UserRole.Client) canUpdate = false;
        if (role === UserRole.Owner) {
            if (status !== OrderStatus.Cooking && status !== OrderStatus.Cooked)
                canUpdate = false;
        }
        if (role === UserRole.Delivery) {
            if (status !== OrderStatus.PickedUp && status !== OrderStatus.Delivered)
                canUpdate = false;
        }
        return canUpdate;
    }

    async createOrder(
        customer: User,
        { restaurantId, items }: CreateOrderInput
    ): Promise<CreateOrderOutput> {
        try {
            // get restaurant
            const restaurant = await this.restaurants.findOne(restaurantId);
            if (!restaurant) {
                return {
                    ok: false,
                    error: 'Restaurant not found'
                };
            }

            const orderItems: OrderItem[] = [];
            let orderFinalPrice = 0;
            // create list order item
            for (const item of items) {
                // get the dish
                const dish = await this.dishes.findOne(item.dishId);
                if (!dish) {
                    // if a dish not found -> abort the whole thing
                    return {
                        ok: false,
                        error: 'Dish not found.',
                    };
                }

                let dishFinalPrice = dish.price;
                // compare dish option with item option, add price + extra
                for (const itemOption of item.options) {
                    const dishOption = dish.options.find(
                        dishOption => dishOption.name === itemOption.name,
                    )
                    // if !dishOption.extra -> check choice extra
                    if (dishOption) {
                        if (dishOption.extra) {
                            console.log(`${dishOption.name} + $USD ${dishOption.extra}`);
                            dishFinalPrice = dishFinalPrice + dishOption.extra;
                        } else {
                            const dishOptionChoice = dishOption.choices?.find(
                                dishOptionChoice => dishOptionChoice.name === itemOption.choice,
                            );
                            if (dishOptionChoice) {
                                if (dishOptionChoice.extra) {
                                    console.log(`${dishOptionChoice.name} + $USD ${dishOptionChoice.extra}`)
                                    dishFinalPrice = dishFinalPrice + dishOptionChoice.extra;
                                }
                            }
                        }
                    }

                }
                orderFinalPrice = orderFinalPrice + dishFinalPrice*item.quantity;

                // create item
                const orderItem = await this.orderItems.save(this.orderItems.create({
                    dish,
                    options: item.options,
                }));
                orderItems.push(orderItem);
            }

            // create order
            const order = await this.orders.save(this.orders.create({
                customer,
                restaurant,
                total: orderFinalPrice,
                items: orderItems,
            }));
            //add dish
            if(order) {
                order.items.map(item => setItemPrice(item));
            }
            await this.pubSub.publish(
                NEW_PENDING_ORDER,
                { pendingOrders: { order, ownerId: restaurant.ownerId } }
            );

            return {
                ok: true,
                orderId: order.id
            };

        } catch (error) {
            console.log(error);
            return {
                ok: false,
                error: "Could not create order.",
            };
        }
    }

    async getOrders(user: User, { status }: GetOrdersInput): Promise<GetOrdersOutput> {
        try {
            let orders: Order[];
            if (user.role === UserRole.Client) {
                orders = await this.orders.find({
                    where: {
                        customer: user,
                        ...(status && { status })
                    },
                });
            } else if (user.role === UserRole.Delivery) {
                orders = await this.orders.find({
                    where: {
                        driver: user,
                        ...(status && { status })
                    },
                });
            } else if (user.role === UserRole.Owner) {
                const restaurants = await this.restaurants.find(
                    {
                        where: {
                            owner: user,
                            // ...(status && { status })
                        },
                        relations: ['orders'],
                    },
                );
                console.log(restaurants);
                orders = this.flatDeep(restaurants.map(restaurant => restaurant.orders));
                if (status) {
                    orders = orders.filter(order => order.status === status);
                }
            }

            return {
                ok: true,
                orders
            };

        } catch (error) {
            console.log(error);
            return {
                ok: false,
                error: 'Could not get orders',
            };
        }
    }

    async getOrder(user: User, { id: orderId }: GetOrderInput): Promise<GetOrderOutput> {
        try {
            //const order = await this.orders.findOne(orderId, { relations: ['restaurant']});  //restaurant not eager -> has to load relations
            const order = await this.orders.findOne(orderId);
            if (!order) {
                return {
                    ok: false,
                    error: 'Order not found.'
                };
            }

            if (!order.restaurant) {
                return {
                    ok: false,
                    error: 'Restaurant not found.'
                };
            }

            if (!this.checkOrderPrivilege(user, order)) {
                return {
                    ok: false,
                    error: "You can't see that"
                };
            }

            // map dish to each order item
            order.items.map((item) => setItemPrice(item));
            // const orderItems = await this.orderItems.findByIds(orderItemIds, {relations:['dish']});
            // console.log(orderItems.map(item => item.dish));
            // orderItems.map(mapItem => {
            //     order.items.map(item => {
            //         if(item.id === mapItem.id) {
            //             item.dish = mapItem.dish;
            //             // set itemPrice
            //             let optionPrice = 0;
            //             let optionNames = mapItem.options?.map(option => option.name);
            //             const chosenOptions = item.dish.options?.filter(option => optionNames.includes(option.name) )
            //             chosenOptions?.map(option => optionPrice = optionPrice + option.extra);
            //             item.itemPrice = item.dish.price + optionPrice;
            //         }
            //     })
            // })

            return {
                ok: true,
                order
            };

        } catch (error) {
            console.log(error);
            return {
                ok: false,
                error: 'Could not get order',
            };
        }
    }

    async updateOrderStatus(user: User, { id: orderId, status }: EditOrderInput): Promise<EditOrderOutput> {
        try {
            const order = await this.orders.findOne(orderId);
            if (!order) {
                return {
                    ok: false,
                    error: 'Order not found'
                };
            }

            if (!order.restaurant) {
                return {
                    ok: false,
                    error: 'Restaurant not found.'
                };
            }

            if (this.checkOrderPrivilege(user, order)) {
                if (this.checkOrderStatusUpdatePrivilege(user.role, status)) {
                    await this.orders.save({    // does not return whole order 
                        id: orderId,
                        status,
                    });
                    const newOrder = { ...order, status };
                    //add dish
                    if(newOrder) {
                        newOrder.items.map(item => setItemPrice(item));
                    }
                    if (user.role === UserRole.Owner) {
                        if (status === OrderStatus.Cooked) {
                            await this.pubSub.publish(
                                NEW_COOKED_ORDER,
                                { cookedOrders: newOrder }
                            );
                        }
                    }
                    await this.pubSub.publish(NEW_ORDER_UPDATE, { orderUpdates: newOrder });
                    return {
                        ok: true
                    }
                }
            }
            return {
                ok: false,
                error: "You can't edit that"
            };

        } catch (error) {
            console.log(error);
            return {
                ok: false,
                error: 'Could not edit order.',
            };
        }
    }

    async takeOrder(driver: User, { id: orderId }: TakeOrderInput): Promise<TakeOrderOutput> {
        try {
            const order = await this.orders.findOne(orderId);
            if (!order) {
                return {
                    ok: false,
                    error: 'Order not found',
                }
            }
            if (!order.restaurant) {
                return {
                    ok: false,
                    error: 'Restaurant not found.'
                };
            }
            if (order.driver) {
                return {
                    ok: false,
                    error: 'This order already has a driver'
                };
            }

            await this.orders.save({
                id: orderId,
                driver,
            })
            //add dish
            if(order) {
                order.items.map(item => setItemPrice(item));
            }
            await this.pubSub.publish(
                NEW_ORDER_UPDATE,
                { orderUpdates: { ...order, driver } }
            );
            return {
                ok: true
            };

        } catch (error) {
            console.log(error);
            return {
                ok: false,
                error: 'Could not take order'
            };
        }
    }

}