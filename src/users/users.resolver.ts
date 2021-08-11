import { UseGuards } from "@nestjs/common";
import { Args, Context, Mutation, Query, Resolver } from "@nestjs/graphql";
import { AuthUser } from "src/auth/auth-user.decorator";
import { AuthGuard } from "src/auth/auth.guard";
import { CreateAccountInput, CreateAccountOutput } from "./dtos/create-account.dto";
import { EditProfileInput, EditProfileOutput } from "./dtos/edit-profile.dto";
import { LoginInput, LoginOutput } from "./dtos/login.dot";
import { UserProfileInupt, UserProfileOutput } from "./dtos/user-profile.dto";
import { User } from "./entities/user.entity";
import { UsersService } from "./users.service";

@Resolver(of => User)
export class UsersResolver {
    constructor(
        private readonly usersService: UsersService
    ) { }

    @Query(returns => Boolean)
    hi () {
        return true;
    }

    @Mutation(returns => CreateAccountOutput)
    async createAccount (@Args("input") createAccountInput: CreateAccountInput)
        : Promise<CreateAccountOutput> {
        try {
            const { ok, error } = await this.usersService.createAccount(createAccountInput);
            return {
                ok,
                error
            }
        } catch (error) {
            return {
                error,
                ok: false,
            }
        }
    }

    @Mutation(returns => LoginOutput)
    async login (@Args('input') loginInput: LoginInput): Promise<LoginOutput> {
        try {
            return await this.usersService.login(loginInput)
        } catch (e) {
            return {
                ok: false,
                error: e
            }
        }
    }

    @Query(returns => User)
    @UseGuards(AuthGuard)
    me (@AuthUser() authUser: User) {
        return authUser;
    }

    @Query(returns => UserProfileOutput)
    @UseGuards(AuthGuard)
    async userProfile (@Args() userProfileInupt: UserProfileInupt): Promise<UserProfileOutput> {
        try {
            const user = await this.usersService.findById(userProfileInupt.userId)
            console.log(user);
            if (!user) {
                throw new Error("User Not Found");
            }
            return {
                ok: Boolean(user),
                user,
            }
        } catch (e) {
            return {
                error: 'User not found',
                ok: false,
            }
        }
    }

    @UseGuards(AuthGuard)
    @Mutation(returns => EditProfileOutput)
    async editProfile (
        @AuthUser() authUser: User,
        @Args('input') editProfileInput: EditProfileInput
    ): Promise<EditProfileOutput> {
        try {
            await this.usersService.editProfile(authUser.id, editProfileInput)
            return {
                ok: true,
            }
        } catch (error) {
            return {
                ok: false,
                error
            }
        }
    }
}