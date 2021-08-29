import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Cron } from '@nestjs/schedule';
import { Restaurant } from "src/restaurants/entities/restaurant.entity";
import { User } from "src/users/entities/user.entity";
import { Repository } from "typeorm";
import { CreatePaymentInput, CreatePaymentOutput } from "./dto/create-payment.dto";
import { GetPaymentsOutput } from "./dto/get-payments.dto";
import { Payment } from "./entities/payment.entity";

@Injectable()
export class PaymentService {
    constructor(
        @InjectRepository(Payment)
        private readonly payments: Repository<Payment>,
        @InjectRepository(Restaurant)
        private readonly restaurants: Repository<Restaurant>,
    ) { }

    async createPayment (
        owner: User,
        { transacctionId, restaurantId }: CreatePaymentInput
    ): Promise<CreatePaymentOutput> {
        try {
            const restaurant = await this.restaurants.findOne(restaurantId);
            if (!restaurant) {
                return {
                    ok: false,
                    error: "Restaurant not found."
                }
            }
            if (restaurant.ownerId !== owner.id) {
                return {
                    ok: false,
                    error: "Permission denied."
                }
            }
            await this.payments.save(
                this.payments.create({
                    transacctionId,
                    user: owner,
                    restaurant,
                })
            )
            restaurant.isPromoted = true;
            const date = new Date();
            date.setDate(date.getDate() + 7);
            restaurant.promoteUntil = date;
            await this.restaurants.save(restaurant);
            return {
                ok: true,
            }
        } catch (error) {
            return {
                ok: false,
                error: "Could not create payment."
            }
        }
    }

    async getPayments (
        user: User,
    ): Promise<GetPaymentsOutput> {
        try {
            const payments = await this.payments.find({ user });
            return {
                ok: true,
                payments,
            }
        } catch (e) {
            return {
                ok: false,
                error: "Could not get payments."
            }
        }
    }

    @Cron("30 * * * * *")
    async checkForPayments () {
        console.log('Checking for payments');
    }

}