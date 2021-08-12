import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CreateAccountInput, CreateAccountOutput } from "./dtos/create-account.dto";
import { LoginInput, LoginOutput } from "./dtos/login.dot";
import { User } from "./entities/user.entity";

import { ConfigService } from "@nestjs/config";
import { JwtService } from "src/jwt/jwt.service";
import { EditProfileInput, EditProfileOutput } from "./dtos/edit-profile.dto";
import { Verification } from "./entities/verification.entity";
import { UserProfileOutput } from "./dtos/user-profile.dto";
import { VerifyEmailOutput } from "./dtos/verify-email.dto";
import { MailService } from "src/mail/mail.service";

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        @InjectRepository(Verification)
        private readonly verificationRepository: Repository<Verification>,
        private readonly jwtService: JwtService,
        private readonly mailService: MailService
    ) { }

    async createAccount ({ email, password, role }: CreateAccountInput): Promise<CreateAccountOutput> {
        try {
            const exists = await this.userRepository.findOne({ email });
            if (exists) {
                return { ok: false, error: 'There is a user with that email already.' };
            }
            const user = await this.userRepository.create({ email, password, role })
            await this.userRepository.save(user)
            const verification = await this.verificationRepository.save(this.verificationRepository.create({
                user,
            }))
            this.mailService.sendVerificationEmail(user.email, verification.code)
            return { ok: true };
        } catch (e) {
            return { ok: false, error: `Couldn't create account.` };
        }
    }

    async login ({ email, password }: LoginInput):
        Promise<LoginOutput> {
        // find user with email
        try {
            const user = await this.userRepository.findOne(
                { email },
                { select: ['id', 'password'] }
            );

            if (!user) {
                return {
                    ok: false,
                    error: "User not found",
                }
            }
            // check if the password is correct
            const isCorrect = await user.checkPassword(password);
            if (!isCorrect) {
                return {
                    ok: false,
                    error: 'Wrong password',
                }
            }
            // make a JWT and give it to a user
            const token = this.jwtService.sign(user.id);
            return {
                ok: true,
                token,
            }
        } catch (error) {
            return {
                ok: false,
                error,
            }
        }

    }

    async findById (id: number): Promise<UserProfileOutput> {
        try {
            const user = await this.userRepository.findOne({ id })
            if (!user) {
                throw new Error("User Not Found");
            }
            return {
                ok: true,
                user,
            }
        } catch (error) {
            return {
                error: "User not found.",
                ok: false,
            }
        }
    }

    async editProfile (userId: number, { email, password }: EditProfileInput): Promise<EditProfileOutput> {
        try {
            const user = await this.userRepository.findOne(userId);
            if (email) {
                user.email = email;
                user.verified = false;
                const verification = await this.verificationRepository.save(this.verificationRepository.create({
                    user,
                }));
                this.mailService.sendVerificationEmail(user.email, verification.code)
            }
            if (password) {
                user.password = password;
            }
            await this.userRepository.save(user);
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

    async verifyEmail (code: string): Promise<VerifyEmailOutput> {
        try {
            const verification = await this.verificationRepository.findOne({ code }, { relations: ['user'] });
            if (verification) {
                verification.user.verified = true;
                await this.userRepository.save(verification.user);
                await this.verificationRepository.delete(verification.id);
                return { ok: true, };
            }
            throw new Error();
        }
        catch (error) {
            console.log(error);
            return {
                ok: false,
                error
            }
        }
    }
}