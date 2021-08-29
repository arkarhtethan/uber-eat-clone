import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Restaurant } from 'src/restaurants/entities/restaurant.entity';
import { RestaurantsModule } from 'src/restaurants/restaurants.module';
import { Payment } from './entities/payment.entity';
import { PaymentResolver } from './payment.resolver';
import { PaymentService } from './payment.service';

@Module({
    imports: [
        RestaurantsModule,
        TypeOrmModule.forFeature([Payment, Restaurant])
    ],
    providers: [
        PaymentService,
        PaymentResolver,
    ]
})
export class PaymentsModule { }
