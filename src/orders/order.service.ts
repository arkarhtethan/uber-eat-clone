import { Inject, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { PubSub } from "graphql-subscriptions";
import { NEW_PENDING_ORDER, PUB_SUB } from "src/common/common.constant";
import { Dish } from "src/restaurants/entities/dish.entity";
import { Restaurant } from "src/restaurants/entities/restaurant.entity";
import { User, UserRole } from "src/users/entities/user.entity";
import { Repository } from "typeorm";
import { CreateOrderInput, CreateOrderOutput } from "./dtos/create-order.dto";
import { EditOrderInput, EditOrderOutput } from "./dtos/edit-order.dto";
import { GetOrderInput, GetOrderOutput } from "./dtos/get-order.dto";
import { GetOrdersInput, GetOrdersOutput } from "./dtos/get-orders.dto";
import { OrderItem } from "./entities/order-item.entity";
import { Order, OrderStatus } from "./entities/order.entity";

@Injectable()
export class OrderService {
    constructor(
        @InjectRepository(Order)
        private readonly orders: Repository<Order>,
        @InjectRepository(Restaurant)
        private readonly restaurants: Repository<Restaurant>,
        @InjectRepository(OrderItem)
        private readonly orderItems: Repository<OrderItem>,
        @InjectRepository(Dish)
        private readonly dishes: Repository<Dish>,
        @Inject(PUB_SUB)
        private readonly pubSub: PubSub,
    ) { }

    flat (input, depth = 1, stack = []) {
        for (let item of input) {
            if (item instanceof Array && depth > 0) {
                this.flat(item, depth - 1, stack);
            }
            else {
                stack.push(item);
            }
        }

        return stack;
    }

    canSeeOrder (user: User, order: Order): boolean {
        let canSee = true;
        if (user.role === UserRole.Client && order.customerId !== user.id) {
            canSee = false;
        }
        if (user.role === UserRole.Delivery && order.driverId !== user.id) {
            canSee = false;
        }
        if (
            user.role === UserRole.Owner &&
            order.restaurant.ownerId !== user.id
        ) {
            canSee = false;
        }
        return canSee;
    }

    async createOrder (
        customer: User,
        { restaurantId, items }: CreateOrderInput,
    ): Promise<CreateOrderOutput> {
        try {
            const restaurant = await this.restaurants.findOne(restaurantId);
            if (!restaurant) {
                return {
                    ok: false,
                    error: "Restaurant not found."
                }
            }
            let orderFinalPrice = 0;
            const orderItems: OrderItem[] = [];
            for (const item of items) {
                const dish = await this.dishes.findOne(item.dishId)
                if (!dish) {
                    return {
                        ok: false,
                    }
                }
                let dishFinalPrice = dish.price;
                for (let { name, choice } of item.options) {
                    const dishOption = dish.options.find(dishOption => dishOption.name === name);
                    if (dishOption) {
                        if (dishOption.extra) {
                            dishFinalPrice += dishOption.extra;
                        } else {
                            if (dishOption.choices) {
                                const dishOptionChoice = dishOption.choices.find(optionChoice => optionChoice.name === choice);
                                if (dishOptionChoice) {
                                    if (dishOptionChoice.extra) {
                                        dishFinalPrice += dishOptionChoice.extra;
                                    }
                                }
                            }
                        }
                    }
                }
                orderFinalPrice = orderFinalPrice + dishFinalPrice;
                const orderItem = await this.orderItems.save(
                    this.orderItems.create(
                        {
                            dish,
                            options: item.options,
                        }
                    )
                )
                orderItems.push(orderItem);
            }
            const order = await this.orders.save(
                this.orders.create(
                    {
                        customer,
                        restaurant,
                        total: orderFinalPrice,
                        items: orderItems,
                    }
                )
            )
            await this.pubSub.publish(NEW_PENDING_ORDER, { pendingOrders: { order, ownerId: restaurant.ownerId, } });
            return {
                ok: true,
            }
        } catch (error) {
            return {
                ok: false,
                error: "Could not create order."
            }
        }
    }

    async getOrders (
        user: User,
        { status }: GetOrdersInput
    ): Promise<GetOrdersOutput> {
        try {
            let orders: Order[] = [];
            if (user.role === UserRole.Client) {
                orders = await this.orders.find({
                    where: {
                        customer: user,
                        ...(status && { status }),
                    },
                })
            } else if (user.role === UserRole.Delivery) {
                orders = await this.orders.find({
                    where: {
                        customer: user,
                        ...(status && { status }),
                    }
                })
            } else if (user.role === UserRole.Owner) {
                const restaurants = await this.restaurants.find({
                    where: {
                        owner: user,
                    },
                    relations: ['orders',]
                });
                orders = this.flat(restaurants.map(restaurant => restaurant.orders));
                console.log(orders);
                if (status) {
                    orders = orders.filter(order => order.status === status);
                }
            }
            return {
                orders,
                ok: true,
            }
        } catch (e) {
            return {
                ok: false,
                error: "Could not get orders."
            }
        }

    }

    async getOrder (
        user: User,
        { id: orderId }: GetOrderInput
    ): Promise<GetOrderOutput> {
        try {
            const order = await this.orders.findOne(orderId, { relations: ['restaurant', 'items'] });
            if (!order) {
                return {
                    ok: false,
                    error: "Order not found."
                }
            }

            if (!this.canSeeOrder(user, order)) {
                return {
                    ok: false,
                    error: "Permission denied."
                }
            }
            return {
                ok: true,
                order,
            }
        } catch (e) {
            return {
                ok: false,
                error: "Could no find order."
            }
        }
    }

    async editOrder (
        user: User,
        { id: orderId, status }: EditOrderInput
    ): Promise<EditOrderOutput> {
        try {
            const order = await this.orders.findOne(orderId, {
                relations: ['restaurant']
            });
            if (!order) {
                return {
                    ok: false,
                    error: "Order not found",
                }
            }
            if (!this.canSeeOrder(user, order)) {
                return {
                    ok: false,
                    error: "Permission denied."
                }
            }
            let canEdit = true;
            if (user.role === UserRole.Client) {
                canEdit = false;
            }
            if (user.role === UserRole.Owner) {
                if (status !== OrderStatus.Cooking && status !== OrderStatus.Cooked) {
                    canEdit = false;
                }
            }
            if (user.role === UserRole.Delivery) {
                if (status !== OrderStatus.PickedUp && status !== OrderStatus.Delivered) {
                    canEdit = false;
                }
            }
            if (!canEdit) {
                return {
                    ok: false,
                    error: "You can't do that."
                }
            }
            await this.orders.save(
                [{
                    id: orderId,
                    status,
                }]
            )
            return {
                ok: true,
            }
        } catch (e) {
            return {
                ok: false,
                error: "Could not edit order."
            }
        }
    }
}
