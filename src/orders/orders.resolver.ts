import { Inject, PayloadTooLargeException } from "@nestjs/common";
import { Args, Mutation, Query, Resolver, Subscription } from "@nestjs/graphql";
import { PubSub } from "graphql-subscriptions";
import { AuthUser } from "src/auth/auth-user.decorator";
import { Role } from "src/auth/role.decorator";
import { NEW_COOKED_ORDER, NEW_ORDER_UPDATE, NEW_PENDING_ORDER, PUB_SUB } from "src/common/common.constant";
import { User } from "src/users/entities/user.entity";
import { CreateOrderInput, CreateOrderOutput } from "./dtos/create-order.dto";
import { EditOrderInput, EditOrderOutput } from "./dtos/edit-order.dto";
import { GetOrderInput, GetOrderOutput } from "./dtos/get-order.dto";
import { GetOrdersInput, GetOrdersOutput } from "./dtos/get-orders.dto";
import { OrderUpdatesInput } from "./dtos/order-updates.dto";
import { TakeOrderInput, TakeOrderOuput } from "./dtos/take-order.dto";
import { Order } from "./entities/order.entity";
import { OrderService } from "./order.service";

@Resolver(of => Order)
export class OrderResolver {

    constructor(
        private readonly orderService: OrderService,
        @Inject(PUB_SUB)
        private readonly pubsub: PubSub,
    ) { }

    @Mutation(returns => CreateOrderOutput)
    @Role(['Client'])
    async createOrder (
        @AuthUser() customer: User,
        @Args('input') createOrderInput: CreateOrderInput,
    ): Promise<CreateOrderOutput> {
        return this.orderService.createOrder(customer, createOrderInput);
    }

    @Query(returns => GetOrdersOutput)
    @Role(['Any'])
    async getOrders (
        @AuthUser() user: User,
        @Args('input') getOrdersInput: GetOrdersInput,
    ): Promise<GetOrdersOutput> {
        return this.orderService.getOrders(user, getOrdersInput);
    }

    @Query(returns => GetOrderOutput)
    @Role(['Any'])
    async getOrder (
        @AuthUser() user: User,
        @Args('input') getOrderInput: GetOrderInput,
    ): Promise<GetOrderOutput> {
        return this.orderService.getOrder(user, getOrderInput);
    }

    @Mutation(returns => EditOrderOutput)
    @Role(['Any'])
    async editOrder (
        @AuthUser() user: User,
        @Args('input') editOrderInput: EditOrderInput
    ) {
        return this.orderService.editOrder(user, editOrderInput);
    }

    @Subscription(returns => Order,
        {
            filter: ({ pendingOrders: { ownerId } }, _, { user }) => {
                return ownerId === user.id;
            },
            resolve: ({ pendingOrders: { order } }) => order,
        }
    )
    @Role(['Owner'])
    pendingOrders () {
        return this.pubsub.asyncIterator(NEW_PENDING_ORDER)
    }

    @Subscription(returns => Order,)
    @Role(['Delivery'])
    cookedOrders () {
        return this.pubsub.asyncIterator(NEW_COOKED_ORDER)
    }

    @Subscription(
        returns => Order,
        {
            filter: (
                { orderUpdates: order }: { orderUpdates: Order },
                { input: { id } }: { input: OrderUpdatesInput },
                { user }: { user: User }
            ) => {
                if (
                    order.driverId !== user.id &&
                    order.customerId !== user.id &&
                    order.restaurant.ownerId !== user.id
                ) {
                    return false;
                }
                return order.id === id;
            }
        }
    )
    @Role(['Any'])
    orderUpdates (@Args('input') orderUpdatesInput: OrderUpdatesInput) {
        return this.pubsub.asyncIterator(NEW_ORDER_UPDATE)
    }

    @Mutation(returns => TakeOrderOuput)
    @Role(['Delivery'])
    takeOrder (
        @AuthUser() driver: User,
        @Args('input') takeOrderInput: TakeOrderInput
    ): Promise<TakeOrderOuput> {
        return this.orderService.takeOrder(driver, takeOrderInput);
    }
}
