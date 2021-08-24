import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "src/users/entities/user.entity";
import { Repository } from "typeorm";
import { AllCategoriesOutput } from "./dtos/all-categories.dto";
import { CategoryInput, CategoryOutput } from "./dtos/category.dto";
import { CreateRestaurantInput, CreateRestaurantOutput } from "./dtos/create-restaurant.dto";
import { DeleteRestaurantInput, DeleteRestaurantOutput } from "./dtos/delete-restaurant.dto";
import { EditRestaurantInput, EditRestaurantOutput } from "./dtos/edit-restaurant.dto";
import { RestaurantInput, RestaurantOutput } from "./dtos/restaurant.dto";
import { RestaurantsOutput, RestaurantsInput } from "./dtos/restaurants.dto";
import { Category } from "./entities/category.entity";
import { Restaurant } from "./entities/restaurant.entity";
import { CategoryRepository } from "./repositories/category.repository";

@Injectable()
export class RestaurantService {
    constructor(
        @InjectRepository(Restaurant)
        private restaurantRepository: Repository<Restaurant>,
        @InjectRepository(Category)
        private categories: CategoryRepository
    ) { }

    async createRestaurant (
        owner: User,
        createRestaurantInput: CreateRestaurantInput,
    ): Promise<CreateRestaurantOutput> {
        try {
            const newRestaurant = this.restaurantRepository.create(createRestaurantInput)
            newRestaurant.owner = owner;
            let category = await this.categories.getOrCreate(createRestaurantInput.categoryName);
            newRestaurant.category = category;
            await this.restaurantRepository.save(newRestaurant);
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
            const restaurant = await this.restaurantRepository.findOne(
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
            await this.restaurantRepository.save(this.restaurantRepository.create([{
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
            const restaurant = await this.restaurantRepository.findOne(restaurantId);
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
            await this.restaurantRepository.delete(restaurantId)
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

    async allCategories (): Promise<AllCategoriesOutput> {
        try {
            const categories = await this.categories.find();
            return {
                ok: true,
                categories
            }
        } catch (e) {
            return {
                ok: false,
                error: 'Could not load categories.'
            }
        }
    }

    countRestaurant (category: Category) {
        return this.restaurantRepository.count({ category });
    }

    async findCategoryBySlug ({ slug, page }: CategoryInput): Promise<CategoryOutput> {
        try {
            const category = await this.categories.findOne({ slug }, { relations: ['restaurants'] });
            if (!category) {
                return {
                    ok: false,
                    error: 'Category not found.'
                }
            }
            const restaurants = await this.restaurantRepository.find({
                where: {
                    category,
                },
                take: 25,
                skip: (page - 1) * 25
            })
            category.restaurants = restaurants;
            const totalResults = await this.countRestaurant(category);
            return {
                ok: true,
                category,
                totalPages: Math.ceil(totalResults / 25),
            }
        } catch (e) {
            return {
                ok: false,
                error: 'Could not load category.'
            }
        }
    }
    async allRestaurants ({ page }: RestaurantsInput): Promise<RestaurantsOutput> {
        try {

            const [restaurants, totalResults] = await this.restaurantRepository.findAndCount({
                take: 25,
                skip: (page - 1) * 25
            })
            return {
                ok: true,
                restaurants,
                totalPages: Math.ceil(totalResults / 25),
                totalResults,
            }
        } catch (e) {
            return {
                ok: false,
                error: 'Could not load restaurants.'
            }
        }
    }

    async findRestaurantById (restaurantInput: RestaurantInput): Promise<RestaurantOutput> {
        try {
            const restaurant = await this.restaurantRepository.findOne(restaurantInput.restaurantId);
            if (!restaurant) {
                return {
                    ok: false,
                    error: 'Restaurant not found.'
                }
            }
            return {
                ok: true,
                restaurant,
            }
        } catch (e) {
            return {
                ok: false,
                error: "Could not find restaurant"
            }
        }
    }
}