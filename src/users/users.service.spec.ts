import { Test } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { JwtService } from "src/jwt/jwt.service";
import { MailService } from "src/mail/mail.service";
import { Repository } from "typeorm";
import { User } from "./entities/user.entity";
import { Verification } from "./entities/verification.entity";
import { UsersService } from "./users.service";

const mockRepoitory = () => ({
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
});

const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
}

const mockMailService = {
    sendVerificationEmail: jest.fn(),
}

type MockRepoitory<T = any> = Partial<Record<keyof Repository<T>, jest.Mock>>;

describe("UserService", () => {

    let service: UsersService;
    let userRepository: MockRepoitory<User>;
    let verificationRepository: MockRepoitory<Verification>;
    let mailService: MailService;

    beforeAll(async () => {
        const module = await Test.createTestingModule({
            providers: [
                UsersService,
                {
                    provide: getRepositoryToken(User),
                    useValue: mockRepoitory(),
                },
                {
                    provide: getRepositoryToken(Verification),
                    useValue: mockRepoitory(),
                },
                {
                    provide: JwtService,
                    useValue: mockJwtService,
                },
                {
                    provide: MailService,
                    useValue: mockMailService,
                }
            ]
        }).compile();
        service = module.get<UsersService>(UsersService)
        mailService = module.get<MailService>(MailService)
        userRepository = module.get(getRepositoryToken(User));
        verificationRepository = module.get(getRepositoryToken(Verification));
    })

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('createAccount', () => {
        const createAccountArgs = {
            email: "",
            password: '',
            role: 0,
        };
        it("should fail if user exists.", async () => {
            userRepository.findOne.mockResolvedValue({
                id: 1,
                email: 'kmh@gmail.com',
            });
            const result = await service.createAccount(createAccountArgs);
            expect(result).toMatchObject(
                {
                    ok: false,
                    error: 'There is a user with that email already.'
                }
            );
        })

        it("should create a new user", async () => {
            userRepository.findOne.mockResolvedValue(undefined);
            userRepository.create.mockResolvedValue(createAccountArgs);
            userRepository.save.mockResolvedValue(createAccountArgs);
            verificationRepository.create.mockReturnValue({
                user: createAccountArgs,
            });
            verificationRepository.save.mockResolvedValue({
                code: 'code',
            });
            const result = await service.createAccount(createAccountArgs);
            expect(userRepository.create).toHaveBeenCalledTimes(1);
            expect(userRepository.create).toHaveBeenCalledWith(createAccountArgs);

            expect(userRepository.save).toHaveBeenCalledTimes(1);
            expect(userRepository.save).toHaveBeenCalledWith(createAccountArgs);

            expect(verificationRepository.create).toHaveBeenCalledTimes(1);
            expect(verificationRepository.create).toHaveBeenCalledWith({ user: createAccountArgs });

            expect(verificationRepository.save).toHaveBeenCalledTimes(1);
            expect(verificationRepository.save).toHaveBeenCalledWith({ user: createAccountArgs });

            expect(mailService.sendVerificationEmail).toHaveBeenCalledTimes(1);
            expect(mailService.sendVerificationEmail).toHaveBeenCalledWith(
                expect.any(String),
                expect.any(String)
            );

            expect(result).toEqual({ ok: true });
        })

        it("should fail on exception", async () => {
            userRepository.findOne.mockRejectedValue(new Error(':)'));
            const result = await service.createAccount(createAccountArgs);
            expect(result).toEqual({ ok: false, error: `Couldn't create account.` })
        })
    });
    it.todo('login');
    it.todo('findById');
    it.todo('editProfile');
    it.todo('verifyEmail');
})