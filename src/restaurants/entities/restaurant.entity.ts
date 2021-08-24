import { Field, InputType, ObjectType } from "@nestjs/graphql";
import { IsString, Length } from "class-validator";
import { CoreEntity } from "src/common/entities/core.entity";
import { Order } from "src/orders/entities/order.entity";
import { User } from "src/users/entities/user.entity";
import { Column, Entity, ManyToOne, OneToMany, RelationId } from "typeorm";
import { Category } from "./category.entity";
import { Dish } from "./dish.entity";

@InputType('RestaurantInputType', { isAbstract: true })
@ObjectType()
@Entity()
export class Restaurant extends CoreEntity {

    @Field(is => String)
    @Column()
    @IsString()
    @Length(5)
    name: string;

    @Field(is => String)
    @Column()
    @IsString()
    coverImage: string;

    @Field(is => String, { defaultValue: "asdasdf" })
    @Column()
    @IsString()
    address: string;

    @Field(is => Category, { nullable: true })
    @ManyToOne(
        type => Category,
        category => category.restaurants,
        { nullable: true, onDelete: 'SET NULL' }
    )
    category: Category;

    @Field(is => User)
    @ManyToOne(
        type => User,
        user => user.restaurants,
        { onDelete: 'CASCADE' }
    )
    owner: User;

    @Field(type => [Order])
    @OneToMany(
        type => Order,
        order => order.customer
    )
    orders: Order[];

    @RelationId((restaurant: Restaurant) => restaurant.owner)
    ownerId: number;

    @Field(type => [Restaurant], { nullable: true })
    @OneToMany(
        type => Dish,
        dish => dish.restaurant
    )
    menu: Dish[];

}