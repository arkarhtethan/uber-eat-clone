import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Dish } from 'src/restaurants/entities/dish.entity';
import { Restaurant } from 'src/restaurants/entities/restaurant.entity';
import { OrderItem } from './entities/order-item.entity';
import { Order } from './entities/order.entity';
import { OrderService } from './order.service';
import { OrderResolver } from './orders.resolver';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Order,
            Restaurant,
            OrderItem,
            Dish,
        ])
    ],
    providers: [
        OrderService,
        OrderResolver,
    ]
})
export class OrdersModule { }
