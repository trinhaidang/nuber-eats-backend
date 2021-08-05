import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Order } from "./entities/order.entity";
import { Repository } from "typeorm";
import { Mutation } from "@nestjs/graphql";
import { CreateOrderInput, CreateOrderOutput } from "./dtos/create-order.dto";
import { User, UserRole } from "src/users/entities/user.entity";
import { Restaurant } from "src/restaurants/entities/restaurant.entity";
import { OrderItem } from "./entities/order-item.entity";
import { Dish } from "src/restaurants/entities/dish.entity";
import { GetOrdersInput, GetOrdersOutput } from "./dtos/get-orders.dto";


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
    ) { }

    flatDeep(array, level = 1) {
        return level > 0 ? array.reduce((acc, val) => acc.concat(Array.isArray(val) ? this.flatDeep(val, level - 1) : val), []) : array.slice();
    };

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
                            const dishOptionChoice = dishOption.choices.find(
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
                orderFinalPrice = orderFinalPrice + dishFinalPrice;

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
            console.log(order);

            return {
                ok: true
            };

        } catch (error) {
            return {
                ok: false,
                error: 'Could not create order',
            };
        }
    }

    async getOrders(user: User, { status }: GetOrdersInput): Promise<GetOrdersOutput> {
        try {
            let orders: Order[];
            if (user.role === UserRole.Client) {
                orders = await this.orders.find({
                    where: { customer: user }
                });
            } else if (user.role === UserRole.Delivery) {
                orders = await this.orders.find({
                    where: { driver: user }
                });
            } else if (user.role === UserRole.Owner) {
                const restaurants = await this.restaurants.find(
                    {
                        where: { owner: user },
                        relations: ['orders'],
                    }
                );
                console.log(restaurants);
                orders = this.flatDeep(restaurants.map(restaurant => restaurant.orders));
                
            }

            return {
                ok: true,
                orders
            };

        } catch (error) {
            return {
                ok: false,
                error: 'Could not get orders',
            };
        }
    }

}