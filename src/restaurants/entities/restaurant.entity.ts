import { Field, InputType, ObjectType } from "@nestjs/graphql";
import { IsBoolean, IsOptional, IsString, Length } from "class-validator";
import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@InputType({ isAbstract: true })
@ObjectType()
@Entity()
export class Restaurant {
    @PrimaryGeneratedColumn()
    @Field(is => Number)
    id: number;

    @Field(is => String)
    @Column()
    @IsString()
    @Length(5)
    name: string;

    @Field(is => Boolean, { nullable: true, defaultValue: true })
    @Column({ default: true })
    @IsOptional()
    @IsBoolean()
    isVegan?: boolean;

    @Field(is => String, { defaultValue: "asdasdf" })
    @Column()
    @IsString()
    address: string;

    @Field(is => String)
    @Column()
    @IsString()
    ownersName: string;

    @Field(is => String)
    @Column()
    @IsString()
    categoryName: string;

}