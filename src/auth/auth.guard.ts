import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { GqlExecutionContext } from "@nestjs/graphql";
import { JwtService } from "src/jwt/jwt.service";
import { User, UserRole } from "src/users/entities/user.entity";
import { UserService } from "src/users/users.service";
import { AllowedRoles, Role } from "./role.decorator";


@Injectable()
export class AuthGuard implements CanActivate {

    constructor(
        private readonly reflector: Reflector,
        private readonly jwtService: JwtService,
        private readonly userService: UserService,
    ) { }

    async canActivate(context: ExecutionContext) {

        //get role from metadata @Role['']
        const roles = this.reflector.get<AllowedRoles>('roles', context.getHandler());
        if (!roles) return true;

        //get token from context sent by GraphQLModule
        const gqlContext = GqlExecutionContext.create(context).getContext();
        const token = gqlContext.token; // use for both http and websocket
        if (!token) return false;

        //decode token to get user
        const decoded = this.jwtService.verify(token.toString());
        if (typeof decoded === 'object' && decoded.hasOwnProperty('id')) {
            const { user } = await this.userService.findById(decoded['id']);

            // add user to context
            if (!user) return false;
            gqlContext['user'] = user;

            // check if match role
            if (roles.includes(UserRole.Any)) return true;
            return roles.includes(user.role);
        } else {
            return false;
        }
    }
}