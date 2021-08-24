import { Field, InputType, ObjectType } from "@nestjs/graphql";
import { IsNumber, IsString, Length } from "class-validator";
import { CoreEntity } from "src/common/entities/core.entity";
import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn, RelationId } from "typeorm";
import { Restaurant } from "./restaurant.entity";

@InputType('DishInputType', { isAbstract: true })
@ObjectType()
@Entity()
export class Dish extends CoreEntity {
    @Field(type => String)
    @Column()
    @IsString()
    @Length(5)
    name: string;

    @Field(type => Number)
    @Column()
    @IsNumber()
    price: number;

    @Field(type => String)
    @Column()
    @IsString()
    photo: string;

    @Field(type => String)
    @Column()
    @IsString()
    @Length(5, 140)
    description: string;

    @Field(is => Restaurant, { nullable: true })
    @ManyToOne(
        type => Restaurant,
        restaurant => restaurant.menu,
        { onDelete: 'CASCADE' }
    )
    restaurant: Restaurant;

    @RelationId((dish: Dish) => dish.restaurant)
    restaurantId: number;
}