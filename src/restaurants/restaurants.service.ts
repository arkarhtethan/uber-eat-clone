import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Restaurant } from "./entities/restaurant.entity";

@Injectable()
export class RestaurantService {
    constructor(
        @InjectRepository(Restaurant)
        private restaurant: Repository<Restaurant>
    ) { }
    getAll (): Promise<Restaurant[]> {
        return this.restaurant.find();
    }

}