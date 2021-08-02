import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as jwt from 'jsonwebtoken';
import { CreateAccountInput, CreateAccountOutput } from './dtos/create-account.dto';
import { LoginInput, LoginOutput } from './dtos/login.dto';
import { User } from "./entities/user.entity";
import { ConfigService } from '@nestjs/config';
import { JwtService } from 'src/jwt/jwt.service';
import { EditProfileInput, EditProfileOutput } from './dtos/edit-profile.dto';
import { Verification } from './entities/verification.entity';
import { VerifyEmailOutput } from './dtos/verify-email.dto';
import { UserProfileOutput } from './dtos/user-profile.dto';
import { MailService } from 'src/mail/mail.service';

@Injectable()
export class UserService {
    constructor(
        @InjectRepository(User) private readonly users: Repository<User>,
        @InjectRepository(Verification) private readonly verifications: Repository<Verification>,
        private readonly jwtService: JwtService,
        private readonly mailService: MailService,
    ) {
    }

    async createAccount({ email, password, role }: CreateAccountInput): Promise<CreateAccountOutput> {
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
            const verification = await this.verifications.save(
                this.verifications.create({
                    user,
                }),
            )
            this.mailService.sendVerificationEmail(user.email, verification.code);
            return { ok: true };
        } catch (e) {
            //make error
            return { ok: false, error: "Couldn't create account" };
        }
        // hash the password
    }

    async login({ email, password }: LoginInput): Promise<LoginOutput> {
        // make a JWT and give it to the user
        try {
            // find the user with the email
            const user = await this.users.findOne(
                { email },
                { select: ['id', 'password'] },
            );
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
                error: 'Can\'t login',
            };
        }
    }

    async findById(id: number): Promise<UserProfileOutput> {
        try {
            const user = await this.users.findOneOrFail({ id });
            return {
                ok: true,
                user
            };
        } catch (error) {
            return {
                ok: false,
                error: 'User Not Found',
            };
        }
    }

    async editProfile(userid: number, { email, password }: EditProfileInput,
    ): Promise<EditProfileOutput> {
        try {
            const user = await this.users.findOne(userid);
            if (!user) {
                return {
                    ok: false,
                    error: 'User Not Found.',
                };
            }
            if (email) {
                user.email = email;
                user.verified = false;
                const verification = await this.verifications.save(this.verifications.create({ user }));
                this.mailService.sendVerificationEmail(user.email, verification.code);
            }
            if (password) {
                user.password = password;
            }
            this.users.save(user);
            return {
                ok: true
            };
        } catch (error) {
            return {
                ok: false,
                error: 'Could not update profile'
            };
        }
    }

    async verifyEmail(code: string): Promise<VerifyEmailOutput> {
        try {
            const verification = await this.verifications.findOne(
                { code },
                { relations: ['user'] },
            );
            if (verification) {
                verification.user.verified = true;
                this.users.save(verification.user);
                this.verifications.delete(verification.id);
                return { ok: true };
            }
            return {
                ok: false,
                error: 'Verification not found.'
            };
        } catch (error) {
            return {
                ok: false,
                error: 'Could not verify email.'
            };
        }
    }
}