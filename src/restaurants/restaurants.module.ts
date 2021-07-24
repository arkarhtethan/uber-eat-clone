import { Module } from '@nestjs/common';
import { Query } from '@nestjs/graphql';
import { RestaurantResolver } from './restaurants.resolver';

@Module({
    providers: [
        RestaurantResolver,
    ]
})
export class RestaurantsModule {
}
