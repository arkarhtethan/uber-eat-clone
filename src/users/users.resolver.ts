import { UseGuards } from "@nestjs/common";
import { Args, Context, Mutation, Query, Resolver } from "@nestjs/graphql";
import { AuthUser } from "src/auth/auth-user.decorator";
import { AuthGuard } from "src/auth/auth.guard";
import { Role } from "src/auth/role.decorator";
import { CreateAccountInput, CreateAccountOutput } from "./dtos/create-account.dto";
import { EditProfileInput, EditProfileOutput } from "./dtos/edit-profile.dto";
import { LoginInput, LoginOutput } from "./dtos/login.dot";
import { UserProfileInupt, UserProfileOutput } from "./dtos/user-profile.dto";
import { VerifyEmailInput, VerifyEmailOutput } from "./dtos/verify-email.dto";
import { User } from "./entities/user.entity";
import { UsersService } from "./users.service";

@Resolver(of => User)
export class UsersResolver {
    constructor(
        private readonly usersService: UsersService
    ) { }

    @Mutation(returns => CreateAccountOutput)
    async createAccount (@Args("input") createAccountInput: CreateAccountInput)
        : Promise<CreateAccountOutput> {
        return this.usersService.createAccount(createAccountInput);
    }

    @Mutation(returns => LoginOutput)
    async login (@Args('input') loginInput: LoginInput): Promise<LoginOutput> {
        return this.usersService.login(loginInput)
    }

    @Query(returns => User)
    @Role(['Any'])
    me (@AuthUser() authUser: User) {
        return authUser;
    }

    @Query(returns => UserProfileOutput)
    @Role(['Any'])
    async userProfile (@Args() userProfileInupt: UserProfileInupt): Promise<UserProfileOutput> {
        return this.usersService.findById(userProfileInupt.userId)
    }

    @Mutation(returns => EditProfileOutput)
    @Role(['Any'])
    async editProfile (
        @AuthUser() authUser: User,
        @Args('input') editProfileInput: EditProfileInput
    ): Promise<EditProfileOutput> {
        return this.usersService.editProfile(authUser.id, editProfileInput)
    }

    @Mutation(returns => VerifyEmailOutput)
    async verifyEmail (
        @Args('input') verifyEmailInput: VerifyEmailInput
    ): Promise<VerifyEmailOutput> {
        return this.usersService.verifyEmail(verifyEmailInput.code);
    }

}