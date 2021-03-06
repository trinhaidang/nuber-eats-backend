import { Resolver, Query, Mutation, Args, Context } from "@nestjs/graphql";
import { CreateAccountInput, CreateAccountOutput } from "./dtos/create-account.dto";
import { LoginInput, LoginOutput } from "./dtos/login.dto";
import { User, UserRole } from "./entities/user.entity";
import { UserService } from "./users.service";
import { AuthUser } from "src/auth/auth-user.decorator"
import { UserProfileInput, UserProfileOutput } from "./dtos/user-profile.dto";
import { EditProfileInput, EditProfileOutput } from "./dtos/edit-profile.dto";
import { VerifyEmailInput, VerifyEmailOutput } from "./dtos/verify-email.dto";
import { Role } from "src/auth/role.decorator";

@Resolver(of => User)
export class UserResolver {
    constructor(
        private readonly usersService: UserService
    ) { }

    @Query(returns => Boolean)
    hi() {
        return true;
    }

    @Mutation(returns => CreateAccountOutput)
    async createAccount(@Args("input") createAccountInput: CreateAccountInput
    ): Promise<CreateAccountOutput> {
        return this.usersService.createAccount(createAccountInput);
    }

    @Mutation(returns => LoginOutput)
    async login(@Args('input') loginInput: LoginInput): Promise<LoginOutput> {
        return this.usersService.login(loginInput);
        
        // driver@delivery.com 12345
        // {
        //     "x-jwt":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OCwiaWF0IjoxNjI4MzQwNDg3fQ.bH9I1P2wAk678V145NCfDUp_F_t9JmClblGhx9n8wPY"
        // }
        // nico@customer.com 121212 client
        // {
        //     "x-jwt":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NywiaWF0IjoxNjI4MTYxMTkwfQ.hjCzNuEQGl6aIQB7V1BmdXQ67BctHdBWdRir9I-lBQM"
        // }
        // admin@admin.com 123 owner
        // {
        //     "x-jwt":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NiwiaWF0IjoxNjI4MDYwMTM1fQ.ipqZNxm4XuIA39zGp-wfWtUw8qgMZVdg24YnijgVt70"
        //  }

    }

    @Query(returns => User)
    // @SetMetadata('roles','Any')
    @Role([UserRole.Any])
    me(@AuthUser() authUser: User) {
        return authUser;
    }

    @Query(returns => UserProfileOutput)
    @Role([UserRole.Any])
    async userProfile(
        @Args() userProfileInput: UserProfileInput
    ): Promise<UserProfileOutput> {
        return this.usersService.findById(userProfileInput.userId);
    }

    @Mutation(returns => EditProfileOutput)
    @Role([UserRole.Any])
    async editProfile(
        @AuthUser() authUser: User,
        @Args('input') editProfileinput: EditProfileInput,
    ): Promise<EditProfileOutput> {
        return this.usersService.editProfile(authUser.id, editProfileinput);
    }

    @Mutation(returns => VerifyEmailOutput)
    verifyEmail(
        @Args('input') { code }: VerifyEmailInput
    ): Promise<VerifyEmailOutput> {
        return this.usersService.verifyEmail(code);
    }
}