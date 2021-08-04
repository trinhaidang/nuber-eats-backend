import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { GqlExecutionContext } from "@nestjs/graphql";
import { AllowedRoles } from "./role.decorator";


@Injectable()
export class AuthGuard implements CanActivate {
    constructor(private readonly reflector: Reflector){}
    canActivate(context: ExecutionContext){
        const role = this.reflector.get<AllowedRoles>('roles', context.getHandler());
        console.log(role);
        const gqlContext = GqlExecutionContext.create(context).getContext();
        const user = gqlContext['user'];
        if(!user) return false;
        return true;
    }
}