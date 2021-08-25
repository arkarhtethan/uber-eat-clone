import { Field, InputType, ObjectType, registerEnumType } from "@nestjs/graphql";
import { IsEnum, IsString, Length } from "class-validator";
import { CoreEntity } from "src/common/entities/core.entity";
import { Restaurant } from "src/restaurants/entities/restaurant.entity";
import { User } from "src/users/entities/user.entity";
import { Column, Entity, JoinTable, ManyToMany, ManyToOne, OneToMany, RelationId } from "typeorm";
import { OrderItem } from "./order-item.entity";

export enum OrderStatus {
    Pending = "Pending",
    Cooking = "Cooking",
    PickedUp = "PickedUp",
    Delivered = "Delivered",
}

registerEnumType(OrderStatus, { name: "OrderStatus" })

@InputType('OrderInputType', { isAbstract: true })
@ObjectType()
@Entity()
export class Order extends CoreEntity {

    @ManyToOne(
        type => User,
        user => user.orders,
        { onDelete: "CASCADE", nullable: true, }
    )
    @Field(type => User, { nullable: true })
    customer?: User;

    @ManyToOne(
        type => User,
        user => user.rides,
        { onDelete: "CASCADE", nullable: true, }
    )
    @Field(type => User, { nullable: true })
    driver?: User;

    @ManyToOne(
        type => Restaurant,
        restaurant => restaurant.orders,
        { onDelete: 'SET NULL', nullable: true },
    )
    @Field(type => Restaurant)
    restaurant: Restaurant;

    @Field(type => [OrderItem])
    @ManyToMany(
        type => OrderItem,
    )
    @JoinTable()
    items: OrderItem[];

    @Column({ nullable: true })
    @Field(type => Number, { nullable: true })
    @IsString()
    total?: number;

    @Column({ type: 'enum', enum: OrderStatus })
    @Field(type => OrderStatus)
    @IsEnum(OrderStatus)
    status: OrderStatus;

}
