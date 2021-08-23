import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "src/users/entities/user.entity";
import { Repository } from "typeorm";
import { CreateRestaurantInput, CreateRestaurantOutput } from "./dtos/create-restaurant.dto";
import { DeleteRestaurantInput, DeleteRestaurantOutput } from "./dtos/delete-restaurant.dto";
import { EditRestaurantInput, EditRestaurantOutput } from "./dtos/edit-restaurant.dto";
import { Category } from "./entities/category.entity";
import { Restaurant } from "./entities/restaurant.entity";
import { CategoryRepository } from "./repositories/category.repository";

@Injectable()
export class RestaurantService {
    constructor(
        @InjectRepository(Restaurant)
        private restaurant: Repository<Restaurant>,
        @InjectRepository(Category)
        private categories: CategoryRepository
    ) { }

    async createRestaurant (
        owner: User,
        createRestaurantInput: CreateRestaurantInput,
    ): Promise<CreateRestaurantOutput> {
        try {
            const newRestaurant = this.restaurant.create(createRestaurantInput)
            newRestaurant.owner = owner;
            let category = await this.categories.getOrCreate(createRestaurantInput.categoryName);
            newRestaurant.category = category;
            await this.restaurant.save(newRestaurant);
            return {
                ok: true,
            }
        } catch (error) {
            return {
                ok: false,
                error: "Could not create restaurant",
            }
        }
    }

    async editRestaurant (
        owner: User,
        editRestaurantInput: EditRestaurantInput
    ): Promise<EditRestaurantOutput> {
        try {
            const restaurant = await this.restaurant.findOne(
                editRestaurantInput.restaurantId);
            if (!restaurant) {
                return {
                    ok: false,
                    error: "Restaurant not found."
                }
            }
            if (owner.id !== restaurant.ownerId) {
                return {
                    ok: false,
                    error: "You can't edit a restaurant that you don't own."
                }
            }
            let category: Category = null;
            if (editRestaurantInput.categoryName) {
                category = await this.categories.getOrCreate(editRestaurantInput.categoryName)
            }
            await this.restaurant.save(this.restaurant.create([{
                id: editRestaurantInput.restaurantId,
                ...editRestaurantInput,
                ...(category && ({ category }))
            }]))
            return {
                ok: true,
            }
        } catch (error) {
            return {
                ok: false,
                error: "Could not edit restaurant."
            }
        }
    }

    async deleteRestaurant (owner: User, { restaurantId }: DeleteRestaurantInput)
        : Promise<DeleteRestaurantOutput> {
        try {
            const restaurant = await this.restaurant.findOne(restaurantId);
            if (!restaurant) {
                return {
                    ok: false,
                    error: "Restaurant not found."
                }
            }
            if (owner.id !== restaurant.ownerId) {
                return {
                    ok: false,
                    error: "You can't delete a restaurant that you don't own."
                }
            }
            await this.restaurant.delete(restaurantId)
            return {
                ok: true,
            }
        } catch (error) {
            return {
                ok: false,
                error: "Could not delete restaurant."
            }
        }
    }
}