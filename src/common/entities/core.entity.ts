import { Field, ObjectType } from "@nestjs/graphql";
import { PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from "typeorm";

@ObjectType()
export class CoreEntity {
    @PrimaryGeneratedColumn()
    @Field(type => Number)
    id: number;

    @CreateDateColumn()
    @Field(type => Date)
    createdAt: Date;

    @UpdateDateColumn()
    @Field(type => Date)
    updatedAt: Date;
}