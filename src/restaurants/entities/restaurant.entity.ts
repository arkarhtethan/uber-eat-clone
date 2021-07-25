import { Field, Int, ObjectType } from "@nestjs/graphql";
import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@ObjectType()
@Entity()
export class Restaurant {
    @PrimaryGeneratedColumn()
    @Field(is => Number)
    id: number;

    @Field(is => String)
    @Column()
    name: string;

    @Field(is => Boolean, { nullable: true })
    @Column()
    isVegan?: boolean;

    @Field(is => String)
    @Column()
    address: string;

    @Field(is => String)
    @Column()
    ownersName: string;

    @Field(is => String)
    @Column()
    categoryName: string;

}