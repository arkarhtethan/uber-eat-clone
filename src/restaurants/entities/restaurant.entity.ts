import { Field, ObjectType } from "@nestjs/graphql";

@ObjectType()
export class Restaurant {

    @Field(is => String)
    name: string;

    @Field(is => Boolean, { nullable: true })
    isVegan?: boolean;

    @Field(is => String)
    address: string;

    @Field(is => String)
    ownersName: string;

}