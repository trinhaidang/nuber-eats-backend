import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Order } from "./entities/order.entity";
import { Repository } from "typeorm";
import { Mutation } from "@nestjs/graphql";
import { CreateOrderInput, CreateOrderOutput } from "./dtos/create-order.dto";
import { User } from "src/users/entities/user.entity";
import { Restaurant } from "src/restaurants/entities/restaurant.entity";


@Injectable()
export class OrderService {

    constructor(
        @InjectRepository(Order)
        private readonly orders: Repository<Order>,
        @InjectRepository(Restaurant)
        private readonly restaurants: Repository<Restaurant>,
    ) {}

    async createOrder(
        customer: User,
        {restaurantId, items}: CreateOrderInput
    ): Promise<CreateOrderOutput> {
        try {
            // get restaurant
            const restaurant = await this.restaurants.findOne(restaurantId);
            if(!restaurant) {
                return {
                    ok: false,
                    error: 'Restaurant not found'
                };
            }
            items.forEach(item => console.log(item.options));
            console.log(items);
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