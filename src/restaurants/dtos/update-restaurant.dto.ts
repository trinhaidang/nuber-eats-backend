import { ArgsType, Field, InputType, PartialType } from "@nestjs/graphql";
import { CreateRestaurantDto } from "./create-restaurant.dto";

@InputType() // InputType => Args in resolver have ''
export class UpdateRestaurantInputType extends PartialType(CreateRestaurantDto,){}

@InputType() // ArgsType => Args in resolver empty
export class UpdateRestaurantDto {
    @Field(type => Number)
    id: number;

    @Field(type => UpdateRestaurantInputType)
    data: UpdateRestaurantInputType;
}