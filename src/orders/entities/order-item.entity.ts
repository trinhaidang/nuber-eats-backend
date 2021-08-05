import { Field, InputType, Int, ObjectType } from "@nestjs/graphql";
import { CoreEntity } from "src/common/entities/core.entity";
import { Dish, DishChoice, DishOption } from "src/restaurants/entities/dish.entity";
import { Column, Entity, ManyToOne, RelationId, OneToMany, ManyToMany, JoinTable } from "typeorm";

@InputType('OrderItemOptionInputType', {isAbstract:true})
@ObjectType()
export class OrderItemOption {
    @Field(type => String)
    name: string;
    @Field(type => String, { nullable: true })  // => type => DishChoice json
    choice?: string;
}


@InputType('OrderItemInputType', { isAbstract: true })
@ObjectType()
@Entity()
export class OrderItem extends CoreEntity {

    @Field(type => Dish)
    @ManyToOne(
        type => Dish,
        {nullable: true, onDelete:'CASCADE'}
    )
    dish: Dish;

    @Field(type => [OrderItemOption], { nullable: true })
    @Column({ type: 'json', nullable: true })
    options?: OrderItemOption[];

}