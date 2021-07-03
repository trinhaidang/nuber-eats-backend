import { Module } from '@nestjs/common';
import { Query } from '@nestjs/graphql';

@Module({})
export class UsersModule {

    @Query(() => String)
    sayHello():string {
        return 'Hello World!';
    }
}
