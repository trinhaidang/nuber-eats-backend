import { Field, InputType, ObjectType } from "@nestjs/graphql";
import { IsBoolean, IsOptional, IsString, Length } from "class-validator";
import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@InputType({ isAbstract: true })
@ObjectType()
@Entity()
export class Restaurant {

    @PrimaryGeneratedColumn()
    @Field(type => Number)
    id: number

    @Field(type => String)
    @Column()
    @IsString()
    @Length(5)
    name: string;

    @Field(type => Boolean, { nullable: true, defaultValue: true }) //default value / setting of dto
    @Column({ default: true }) //default value to save to db
    @IsOptional()
    @IsBoolean()
    isVegan: boolean;

    @Field(type => String, { defaultValue: 'Grand World'})
    @Column()
    @IsString()
    address: string;
}