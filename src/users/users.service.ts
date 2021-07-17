import { Injectable } from '@nestjs/common';
import { InjectRepository} from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateAccountInput } from './dtos/create-account.dto';
import { User } from "./entities/user.entity";

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User) private readonly users: Repository<User>
    ) {}

    async createAccount({email, password, role}: CreateAccountInput){
        try {
            //check exist user
            const exists = await this.users.findOne({ email });
            if(exists){
                //make error
                return;
            }
            // create user 
            await this.users.save(this.users.create({email, password, role}));
            return true;
        } catch(e){
            //make error
            return;
        }
        // hash the password
    }
}