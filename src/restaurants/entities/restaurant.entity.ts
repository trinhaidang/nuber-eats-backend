import { Field, InputType, ObjectType } from "@nestjs/graphql";
import { IsString, Length } from "class-validator";
import { CoreEntity } from "src/common/entities/core.entity";
import { Order } from "src/orders/entities/order.entity";
import { Payment } from "src/payments/entities/payment.entity";
import { User } from "src/users/entities/user.entity";
import { Column, Entity, ManyToOne, RelationId, OneToMany } from "typeorm";
import { Category } from "./category.entity";
import { Dish } from "./dish.entity";

@InputType('RestaurantInputType', { isAbstract: true })
@ObjectType()
@Entity()
export class Restaurant extends CoreEntity {

    @Field(type => String)
    @Column()
    @IsString()
    @Length(1)
    name: string;

    @Field(type => String)
    @Column()
    @IsString()
    coverImg: string;

    @Field(type => String, { defaultValue: 'Grand World' })
    @Column()
    @IsString()
    address: string;

    @Field(type => Category, { nullable: true })
    @ManyToOne(
        type => Category,
        category => category.restaurants,
        { nullable: true, onDelete: 'SET NULL' }
    )
    category: Category;

    @Field(type => User)
    @ManyToOne(
        type => User,
        user => user.restaurants,
        { onDelete: 'CASCADE' }
    )
    owner: User;
    @RelationId((restaurant: Restaurant) => restaurant.owner)
    ownerId: number;

    @Field(type => [Order])
    @OneToMany(
        type => Order,
        order => order.restaurant
    )
    orders: Order[];

    @Field(type => [Dish])
    @OneToMany(
        type => Dish,
        dish => dish.restaurant)
    menu: Dish[];

    @Field(type => Boolean)
    @Column({ default: false })
    isPromoted: boolean;

    @Field(type => Date, { nullable: true })
    @Column({ nullable: true })
    promotedUntil?: Date;

    @Field(type => Boolean)
    @Column({ default: true })
    isValid: boolean;

    // @Field(type => [Payment])
    // @OneToMany(
    //     type => Payment,
    //     payment => payment.restaurant
    // )
    // payments: Payment[];
}