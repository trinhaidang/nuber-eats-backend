import { Resolver } from "@nestjs/graphql";
import { User } from "./entities/user.entity";

@Resolver(of => User)
export class UserResolver{}