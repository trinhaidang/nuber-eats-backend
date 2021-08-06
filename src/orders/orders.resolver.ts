import { Args, Mutation, Resolver, Query, Subscription } from "@nestjs/graphql";
import { AuthUser } from "src/auth/auth-user.decorator";
import { Role } from "src/auth/role.decorator";
import { User } from "src/users/entities/user.entity";
import { CreateOrderInput, CreateOrderOutput } from "./dtos/create-order.dto";
import { EditOrderInput, EditOrderOutput } from "./dtos/edit-order.dto";
import { GetOrderInput, GetOrderOutput } from "./dtos/get-order.dto";
import { GetOrdersInput, GetOrdersOutput } from "./dtos/get-orders.dto";
import { Order } from "./entities/order.entity";
import { OrderService } from "./orders.service";
import { PubSub } from "graphql-subscriptions";
import { Inject } from "@nestjs/common";
import { PUB_SUB } from "src/common/common.constants";


@Resolver(of => Order)
export class OrderResolver {

    constructor(
        private readonly ordersServices: OrderService,
        @Inject(PUB_SUB) private readonly pubSub: PubSub,
    ) {}

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

    @Query(type => GetOrderOutput)
    @Role(['Any'])
    getOrder(
        @AuthUser() user: User,
        @Args('input') getOrderInput: GetOrderInput
    ): Promise<GetOrderOutput> {
        return this.ordersServices.getOrder(user, getOrderInput)
    }

    @Mutation(returns => EditOrderOutput)
    @Role(['Any'])
    async editOrder(
        @AuthUser() user: User,
        @Args('input') editOrderInput: EditOrderInput
    ): Promise<EditOrderOutput> {
        return this.ordersServices.updateOrderStatus(user, editOrderInput);
    }

    // publish
    @Mutation(returns => Boolean)
    potatoReady() {
        this.pubSub.publish('hotPotatos', {
            readyPotato: 'Your potato is ready. '
        });
        return true;
    }

    //listening
    @Subscription(returns => String)
    msg() {  //payload key
        return this.pubSub.asyncIterator('hotPotatos');  //trigger = triggerName
    }

    @Subscription(returns => String)
    @Role(['Any'])
    readyPotato(@AuthUser() user: User) {  
        console.log(user);
        return this.pubSub.asyncIterator('hotPotatos'); 
    }

}