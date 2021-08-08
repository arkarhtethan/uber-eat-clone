import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Restaurant } from './entities/restaurant.entity';
import { RestaurantResolver } from './restaurants.resolver';
import { RestaurantService } from './restaurants.service';

@Module({
    providers: [
        RestaurantResolver,
        RestaurantService,
    ],
    imports: [
        TypeOrmModule.forFeature([Restaurant])
    ],
})
export class RestaurantsModule {
}
