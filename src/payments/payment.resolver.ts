import { Args, Mutation, Query, Resolver } from "@nestjs/graphql";
import { AuthUser } from "src/auth/auth-user.decorator";
import { Role } from "src/auth/role.decorator";
import { User } from "src/users/entities/user.entity";
import { CreatePaymentInput, CreatePaymentOutput } from "./dto/create-payment.dto";
import { GetPaymentsOutput } from "./dto/get-payments.dto";
import { Payment } from "./entities/payment.entity";
import { PaymentService } from "./payment.service";

@Resolver(of => Payment)
export class PaymentResolver {
    constructor(
        private readonly paymentService: PaymentService,
    ) { }

    @Mutation(returns => CreatePaymentOutput)
    @Role(["Owner"])
    createPayment (
        @AuthUser() owner: User,
        @Args('input') createPaymentInput: CreatePaymentInput,
    ): Promise<CreatePaymentOutput> {
        return this.paymentService.createPayment(owner, createPaymentInput)
    }

    @Query(returns => GetPaymentsOutput)
    @Role(['Owner'])
    getPayments (
        @AuthUser() owner: User,
    ): Promise<GetPaymentsOutput> {
        return this.paymentService.getPayments(owner);
    }
}