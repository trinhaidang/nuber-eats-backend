import { Field, Float, InputType, ObjectType, registerEnumType } from "@nestjs/graphql";
import { CoreEntity } from "src/common/entities/core.entity";
import { Dish } from "src/restaurants/entities/dish.entity";
import { Restaurant } from "src/restaurants/entities/restaurant.entity";
import { User } from "src/users/entities/user.entity";
import { Column, Entity, ManyToOne, RelationId, OneToMany, ManyToMany, JoinTable } from "typeorm";

export enum OrderStatus {
    Pending = 'Pending',
    Cooking = 'Cooking',
    PickedUp = 'PickedUp',
    Delivered = 'Delivered',
}

registerEnumType(OrderStatus, { name: 'OrderStatus' });

@InputType('OrderInputType', { isAbstract: true })
@ObjectType()
@Entity()
export class Order extends CoreEntity {

    @Field(type => User, { nullable: true })
    @ManyToOne(
        type => User,
        user => user.orders,
        { onDelete: 'SET NULL', nullable: true }
    )
    customer?: User;

    @Field(type => User, { nullable: true })
    @ManyToOne(
        type => User,
        user => user.rides,
        { onDelete: 'SET NULL', nullable: true }
    )
    driver?: User;

    @Field(type => Restaurant)
    @ManyToOne(
        type => Restaurant,
        restaurant => restaurant.orders,
        {onDelete:'CASCADE'}
    )
    restaurant: Restaurant;

    @Field(type => [Dish])
    @ManyToMany(type => Dish)
    @JoinTable()     // @JoinTable() only own table: order
    dishes: Dish[];

    @Field(type => Float)
    @Column()
    total: number;

    @Field(type => OrderStatus)
    @Column({ type: 'enum', enum: OrderStatus })
    status: OrderStatus;

}