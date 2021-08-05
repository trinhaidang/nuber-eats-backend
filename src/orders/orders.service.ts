import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Order } from "./entities/order.entity";
import { Repository } from "typeorm";
import { Mutation } from "@nestjs/graphql";
import { CreateOrderInput, CreateOrderOutput } from "./dtos/create-order.dto";
import { User } from "src/users/entities/user.entity";
import { Restaurant } from "src/restaurants/entities/restaurant.entity";
import { OrderItem } from "./entities/order-item.entity";
import { Dish } from "src/restaurants/entities/dish.entity";


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
                // compare dish option with item option 
                for (const itemOption of item.options) {
                    const dishOption = dish.options.find(
                        dishOption => dishOption.name === itemOption.name,
                    )
                    // if !dishOption.extra -> check choice extra
                    if (dishOption) {
                        if (dishOption.extra) {
                            console.log(`${dishOption.name} + $USD ${dishOption.extra}`);
                        } else {
                            const dishOptionChoice = dishOption.choices.find(
                                dishOptionChoice => dishOptionChoice.name === itemOption.choice,
                            );
                            if(dishOptionChoice){
                                if(dishOptionChoice.extra){
                                    console.log(`${dishOptionChoice.name} + $USD ${dishOptionChoice.extra}`)
                                }
                            }
                        }
                    }

                }
                // await this.orderItems.save(this.orderItems.create({
                //     dish,
                //     options: item.options,
                // }))
            }
            // create order
            // const order = await this.orders.save(this.orders.create({
            //     customer,
            //     restaurant,
            // }));
            // console.log(order);
            // return { ok: true };
        } catch (error) {
            return {
                ok: false,
                error: 'Could not create order',
            };
        }
    }

}