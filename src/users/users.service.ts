import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CreateAccountInput } from "./dtos/create-account.dto";
import { LoginInput } from "./dtos/login.dot";
import { User } from "./entities/user.entity";

import * as jwt from "jsonwebtoken";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        private readonly configService: ConfigService
    ) { }

    async createAccount ({ email, password, role }: CreateAccountInput): Promise<{ ok: boolean, error?: string }> {
        try {
            const exists = await this.userRepository.findOne({ email });
            if (exists) {
                return { ok: false, error: 'There is a user with that email already.' };
            }
            const user = await this.userRepository.create({ email, password, role })
            await this.userRepository.save(user)
            return { ok: true };
        } catch (e) {
            return { ok: false, error: `Couldn't create account.` };
        }
    }

    async login ({ email, password }: LoginInput):
        Promise<{ ok: boolean, error?: string, token?: string }> {
        // find user with email
        try {
            const user = await this.userRepository.findOne({ email });
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
            const token = jwt.sign({ id: user.id }, this.configService.get("SECRET_KEY"));
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

}