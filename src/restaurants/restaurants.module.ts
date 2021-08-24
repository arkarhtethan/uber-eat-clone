import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Dish } from './entities/dish.entity';
import { Restaurant } from './entities/restaurant.entity';
import { CategoryRepository } from './repositories/category.repository';
import { CategoryResolver, DishResolver, RestaurantResolver } from './restaurants.resolver';
import { RestaurantService } from './restaurants.service';

@Module({
    providers: [
        RestaurantResolver,
        RestaurantService,
        CategoryResolver,
        DishResolver,
    ],
    imports: [
        TypeOrmModule.forFeature([Restaurant, CategoryRepository, Dish])
    ],
})
export class RestaurantsModule {
}
