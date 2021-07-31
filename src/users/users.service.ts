import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as jwt from 'jsonwebtoken';
import { CreateAccountInput } from './dtos/create-account.dto';
import { LoginInput, LoginOutput } from './dtos/login.dto';
import { User } from "./entities/user.entity";
import { ConfigService } from '@nestjs/config';
import { JwtService } from 'src/jwt/jwt.service';
import { EditProfileInput } from './dtos/edit-profile.dto';
import { Verification } from './entities/verification.entity';

@Injectable()
export class UserService {
    constructor(
        @InjectRepository(User) private readonly users: Repository<User>,
        @InjectRepository(Verification) private readonly verifications: Repository<Verification>,
        private readonly jwtService: JwtService,
    ) {
    }

    async createAccount({ email, password, role }: CreateAccountInput): Promise<{ ok: boolean, error?: string }> {
        try {
            //check exist user
            const exists = await this.users.findOne({ email });
            if (exists) {
                //make error
                return { ok: false, error: "There is a user with that email already" };
            }
            // create user 
            const user = await this.users.save(
                this.users.create({ email, password, role })
            );
            // verify
            await this.verifications.save(
                this.verifications.create({
                user,
                }),
            )
            return { ok: true };
        } catch (e) {
            //make error
            return { ok: false, error: "Couldn't create account" };
        }
        // hash the password
    }

    async login({ email, password }: LoginInput): Promise<{ ok: boolean, error?: string, token?: string }> {
        // make a JWT and give it to the user
        try {
            // find the user with the email
            const user = await this.users.findOne({ email });
            if (!user) {
                return {
                    ok: false,
                    error: 'User not found',
                };
            }
            // check if the password is correct
            const passwordCorrect = await user.checkPassword(password);
            if (!passwordCorrect) {
                return {
                    ok: false,
                    error: 'Wrong password',
                };
            }
            const token = this.jwtService.sign(user.id);
            return {
                ok: true,
                token,
            };
        } catch (error) {
            return {
                ok: false,
                error,
            };
        }
    }

    async findById(id: number): Promise<User> {
        return this.users.findOne({ id });
    }

    async editProfile(userid: number, { email, password }: EditProfileInput,
    ): Promise<User> {
        const user = await this.users.findOne(userid);
        if (email) {
            user.email = email;
            user.verified = false;
            await this.verifications.save(this.verifications.create({user}));
        }
        if (password) {
            user.password = password;
        }
        return this.users.save(user);
    }
}