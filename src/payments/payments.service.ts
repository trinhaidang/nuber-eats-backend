import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Payment } from "./entities/payment.entity";
import { Repository } from "typeorm";
import { User } from "src/users/entities/user.entity";
import { CreatePaymentInput, CreatePaymentOutput } from "./dtos/create-payment.dto";
import { Restaurant } from "src/restaurants/entities/restaurant.entity";
import { GetPaymentsOutput } from "./dtos/get-payments.dto";
import { Cron, Interval, Timeout, SchedulerRegistry } from '@nestjs/schedule';

@Injectable()
export class PaymentService {

    constructor(
        @InjectRepository(Payment)
        private readonly payments: Repository<Payment>,
        @InjectRepository(Restaurant)
        private readonly restaurants: Repository<Restaurant>,
        private readonly schedulerRegistry: SchedulerRegistry,
    ) { }

    async createPayment(owner: User, { transactionId, restaurantId }: CreatePaymentInput
    ): Promise<CreatePaymentOutput> {
        try {
            const restaurant = await this.restaurants.findOne(restaurantId);
            if (!restaurant) {
                return {
                    ok: false,
                    error: 'Restaurant not found.'
                };
            }
            if (restaurant.ownerId !== owner.id) {
                return {
                    ok: false,
                    error: 'You are not allowed to do this.'
                };
            }

            await this.payments.save(this.payments.create({
                transactionId,
                user: owner,
                restaurant,
            }));

            return {
                ok: true
            };

        } catch (error) {
            return {
                ok: false,
                error: 'Could not create payment'
            };
        }
    }

    async getPayments(owner: User): Promise<GetPaymentsOutput> {
        try {
            const payments = await this.payments.find({ user: owner });
            return {
                ok: true,
                payments
            }
        } catch (error) {
            return {
                ok: false,
                error: 'Could not get payments'
            }
        }
    }

    @Cron('30 * * * * *', { name: "myjob" }) // run at the second 30 of every min
    checkForPayments() {
        console.log('Checking for payments...(cron)');
        const job = this.schedulerRegistry.getCronJob('myjob');
        console.log(job);
    }

    @Interval(5000)  // run after each 5s
    checkForPayments1() {
        console.log('Checking for payments...(interval)');
    }

    @Timeout(20000)  // run once after start app 20s
    checkForPayments2() {
        console.log('Checking for payments...(timeout)');
    }

}