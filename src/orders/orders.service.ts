import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Order } from "./entities/order.entity";
import { Repository } from "typeorm";
import { Mutation } from "@nestjs/graphql";
import { CreateOrderInput, CreateOrderOutput } from "./dtos/create-order.dto";
import { User } from "src/users/entities/user.entity";


@Injectable()
export class OrderService {

    constructor(
        @InjectRepository(Order)
        private readonly orders: Repository<Order>,
    ) {}

    async createOrder(
        customer: User,
        createOrderInput: CreateOrderInput
    ): Promise<CreateOrderOutput> {
        try {
            return { ok: true };
        } catch (error) {
            return {
                ok: false,
                error: 'Could not create order',
            };
        }
    }

}