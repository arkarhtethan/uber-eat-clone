import { SetMetadata } from "@nestjs/common";
import { Args, Mutation, Parent, Query, ResolveField, Resolver } from "@nestjs/graphql";
import { AuthUser } from "src/auth/auth-user.decorator";
import { Role } from "src/auth/role.decorator";
import { User } from "src/users/entities/user.entity";
import { ThisExpression } from "ts-morph";
import { AllCategoriesOutput } from "./dtos/all-categories.dto";
import { CategoryInput, CategoryOutput } from "./dtos/category.dto";
import { CreateDishInput, CreateDishOutput } from "./dtos/create-dish.dto";
import { CreateRestaurantInput, CreateRestaurantOutput } from "./dtos/create-restaurant.dto";
import { DeleteDishInput, DeleteDishOutput } from "./dtos/delete-dish.dto";
import { DeleteRestaurantInput } from "./dtos/delete-restaurant.dto";
import { EditDishInput, EditDishOutput } from "./dtos/edit-dish.dto";
import { EditRestaurantInput, EditRestaurantOutput } from "./dtos/edit-restaurant.dto";
import { RestaurantInput, RestaurantOutput } from "./dtos/restaurant.dto";
import { RestaurantsOutput, RestaurantsInput } from "./dtos/restaurants.dto";
import { SearchRestaurantInput, SearchRestaurantOutput } from "./dtos/search-restaurant.dto";
import { Category } from "./entities/category.entity";
import { Dish } from "./entities/dish.entity";

import { Restaurant } from "./entities/restaurant.entity";
import { RestaurantService } from "./restaurants.service";

@Resolver(of => Restaurant)
export class RestaurantResolver {

    constructor(private readonly restaurantService: RestaurantService) { }

    @Mutation(returns => CreateRestaurantOutput)
    @Role(["Owner"])
    async createRestaurant (
        @Args('input') createRestaurantInput: CreateRestaurantInput,
        @AuthUser() authUser: User,
    ): Promise<CreateRestaurantOutput> {
        return this.restaurantService.createRestaurant(authUser, createRestaurantInput)
    }

    @Mutation(returns => EditRestaurantOutput)
    @Role(["Owner"])
    editRestaurant (
        @AuthUser() owner: User,
        @Args('input') editRestaurantInput: EditRestaurantInput,
    ): Promise<EditRestaurantOutput> {
        return this.restaurantService.editRestaurant(owner, editRestaurantInput)
    }

    @Mutation(returns => EditRestaurantOutput)
    @Role(["Owner"])
    deleteRestaurant (
        @AuthUser() owner: User,
        @Args('input') deleteRestaurantInput: DeleteRestaurantInput,
    ): Promise<EditRestaurantOutput> {
        return this.restaurantService.deleteRestaurant(owner, deleteRestaurantInput)
    }

    @Query(type => RestaurantsOutput)
    restaurants (@Args('input') restaurantsInput: RestaurantsInput): Promise<RestaurantOutput> {
        return this.restaurantService.allRestaurants(restaurantsInput);
    }

    @Query(type => RestaurantOutput)
    restaurant (@Args('input') restaurantInput: RestaurantInput): Promise<CategoryOutput> {
        return this.restaurantService.findRestaurantById(restaurantInput);
    }

    @Query(returns => SearchRestaurantOutput)
    searchRestaurant (
        @Args('input') searchRestaurantInput: SearchRestaurantInput,
    ): Promise<SearchRestaurantOutput> {
        return this.restaurantService.searchRestaurantByName(searchRestaurantInput);
    }
}

@Resolver(of => Category)
export class CategoryResolver {
    constructor(private readonly restaurantService: RestaurantService) { }

    @ResolveField(type => Number)
    restaurantCount (@Parent() category: Category): Promise<Number> {
        return this.restaurantService.countRestaurant(category);
    }

    @Query(type => AllCategoriesOutput)
    allCategories (): Promise<AllCategoriesOutput> {
        return this.restaurantService.allCategories();
    }

    @Query(type => CategoryOutput)
    category (@Args('input') categoryInput: CategoryInput): Promise<CategoryOutput> {
        return this.restaurantService.findCategoryBySlug(categoryInput);
    }
}


@Resolver(of => Dish)
export class DishResolver {
    constructor(private readonly restaurantService: RestaurantService) { }

    @Mutation(type => CreateDishOutput)
    @Role(["Owner"])
    createDish (
        @AuthUser() owner: User,
        @Args('input') createDishInput: CreateDishInput
    ): Promise<CreateDishOutput> {
        return this.restaurantService.createDish(owner, createDishInput);
    }

    @Mutation(type => CreateDishOutput)
    @Role(["Owner"])
    editDish (
        @AuthUser() owner: User,
        @Args('input') editDishInput: EditDishInput
    ): Promise<EditDishOutput> {
        return this.restaurantService.editDish(owner, editDishInput);
    }

    @Mutation(type => CreateDishOutput)
    @Role(["Owner"])
    deleteDish (
        @AuthUser() owner: User,
        @Args('input') editDishInput: DeleteDishInput
    ): Promise<DeleteDishOutput> {
        return this.restaurantService.deleteDish(owner, editDishInput);
    }


}   