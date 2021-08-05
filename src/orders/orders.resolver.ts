import { Args, Mutation, Resolver, Query } from "@nestjs/graphql";
import { AuthUser } from "src/auth/auth-user.decorator";
import { Role } from "src/auth/role.decorator";
import { User } from "src/users/entities/user.entity";
import { CreateOrderInput, CreateOrderOutput } from "./dtos/create-order.dto";
import { GetOrdersInput, GetOrdersOutput } from "./dtos/get-orders.dto";
import { Order } from "./entities/order.entity";
import { OrderService } from "./orders.service";


@Resolver(of => Order)
export class OrderResolver {

    constructor(private readonly ordersServices: OrderService) {}

    @Mutation(returns => CreateOrderOutput)
    @Role(['Client'])
    createOrder(
        @AuthUser() customer: User,
        @Args('input') createOrderInput: CreateOrderInput
    ): Promise<CreateOrderOutput> {
        return this.ordersServices.createOrder(customer, createOrderInput);
    }   

    @Query(type => GetOrdersOutput)
    @Role(['Any'])
    getOrders(
        @AuthUser() user: User,
        @Args('input') getOrdersInput: GetOrdersInput
    ): Promise<GetOrdersOutput> {
        return this.ordersServices.getOrders(user, getOrdersInput);
    }

}