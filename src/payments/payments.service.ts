import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Payment } from "./entities/payment.entity";
import { Repository } from "typeorm";
import { User } from "src/users/entities/user.entity";
import { CreatePaymentInput, CreatePaymentOutput } from "./dtos/create-payment.dto";



@Injectable()
export class PaymentService {

    constructor(
        @InjectRepository(Payment)
        private readonly payments: Repository<Payment>
    ){}

    async createPayment(user: User, {transactionId, restaurantId}: CreatePaymentInput
    ): Promise<CreatePaymentOutput> {
        try {
            
            return {
                ok: true
            }
            
        } catch (error) {
            return {
                ok: false,
                error: 'Could not create payment'
            };
        }
    }

}