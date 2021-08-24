import { Field, InputType, ObjectType } from "@nestjs/graphql";
import { CoreOutput } from "src/common/dtos/output.dto";
import { PaginationInput, PaginationOutput } from "src/common/dtos/pagination.dto";
import { Restaurant } from "../entities/restaurant.entity";

@InputType()
export class RestaurantInput {
    @Field(type => Number)
    restaurantId: number;
}

@ObjectType()
export class RestaurantOutput extends CoreOutput {
    @Field(type => Restaurant, { nullable: true })
    restaurant?: Restaurant;

}