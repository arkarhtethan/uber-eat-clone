import { Field, InputType, Int, ObjectType } from "@nestjs/graphql";
import { CoreEntity } from "src/common/entities/core.entity";
import { Restaurant } from "src/restaurants/entities/restaurant.entity";
import { User } from "src/users/entities/user.entity";
import { Column, Entity, ManyToOne, RelationId } from "typeorm";

@InputType('PaymentInputType', { isAbstract: true })
@ObjectType()
@Entity()
export class Payment extends CoreEntity {
    @Field(type => String)
    @Column()
    transacctionId: string;

    @Field(type => User)
    @ManyToOne(
        type => User,
        user => user.payments,
    )
    user: User;

    @RelationId((payment: Payment) => payment.user)
    userId: number;

    @Field(type => Restaurant)
    @ManyToOne(type => Restaurant)
    restaurant: Restaurant;

    @Field(type => Number)
    @RelationId((payment: Payment) => payment.restaurant)
    restaurantId: number;

}