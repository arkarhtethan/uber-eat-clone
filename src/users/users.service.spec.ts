import { Test } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { JwtService } from "src/jwt/jwt.service";
import { MailService } from "src/mail/mail.service";
import { Repository } from "typeorm";
import { User, UserRole } from "./entities/user.entity";
import { Verification } from "./entities/verification.entity";
import { UsersService } from "./users.service";

const mockRepoitory = () => ({
    findOne: jest.fn(),
    findOneOrFail: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
    create: jest.fn(),
});

const mockJwtService = () => ({
    sign: jest.fn(() => "signed-token-baby"),
    verify: jest.fn(),
});

const mockMailService = () => ({
    sendVerificationEmail: jest.fn(),
});

type MockRepoitory<T = any> = Partial<Record<keyof Repository<T>, jest.Mock>>;

describe("UserService", () => {

    let service: UsersService;
    let userRepository: MockRepoitory<User>;
    let verificationRepository: MockRepoitory<Verification>;
    let mailService: MailService;
    let jwtService: JwtService;

    beforeEach(async () => {
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
                    useValue: mockJwtService(),
                },
                {
                    provide: MailService,
                    useValue: mockMailService(),
                }
            ]
        }).compile();
        service = module.get<UsersService>(UsersService)
        mailService = module.get<MailService>(MailService)
        jwtService = module.get<JwtService>(JwtService)
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
            role: UserRole.Client,
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

    describe('login', () => {
        const loginArgs = {
            email: '',
            password: '',
        }
        it('should fail if user does not exist', async () => {
            userRepository.findOne.mockResolvedValue(null);
            const result = await service.login(loginArgs);

            expect(userRepository.findOne).toHaveBeenCalledTimes(1);
            expect(userRepository.findOne).toHaveBeenCalledWith(
                expect.any(Object),
                expect.any(Object),
            );

            expect(result).toEqual({
                ok: false,
                error: "User not found",
            })
        })

        it('should fail if the password is wrong', async () => {
            const mockedUser = {
                id: 1,
                checkPassword: jest.fn(() => Promise.resolve(false)),
            }
            userRepository.findOne.mockResolvedValue(mockedUser);
            const result = await service.login(loginArgs);
            expect(result).toEqual({
                ok: false,
                error: 'Wrong password',
            });
        })

        it('should return token if password correct', async () => {
            const mockedUser = {
                id: 1,
                checkPassword: jest.fn(() => Promise.resolve(true)),
            }
            userRepository.findOne.mockResolvedValue(mockedUser);
            const result = await service.login(loginArgs);
            expect(jwtService.sign).toHaveBeenCalledTimes(1);
            expect(jwtService.sign).toHaveBeenCalledWith(expect.any(Number));
            expect(result).toEqual({ ok: true, token: 'signed-token-baby' })
        })

        it('should fail on exception', async () => {
            userRepository.findOne.mockRejectedValue(new Error());
            const result = await service.login(loginArgs);
            expect(result).toEqual({
                ok: false,
                error: "Wrong credentials",
            })
        })
    });

    describe('findById', () => {
        const findByIdArgs = {
            id: 1,
        }
        it("should find an existing user", async () => {
            userRepository.findOneOrFail.mockResolvedValue(findByIdArgs);
            const result = await service.findById(1);
            expect(result).toEqual({ ok: true, user: findByIdArgs })
        });

        it("should fail if no user is found", async () => {
            userRepository.findOneOrFail.mockRejectedValue(new Error());
            const result = await service.findById(1);
            expect(result).toEqual({
                error: "User not found.",
                ok: false,
            })
        });
    });

    describe('editProfile', () => {
        it("should change email", async () => {
            const oldUser = {
                email: 'kmh@old.com',
                verified: true,
            }
            const editProfileArgs = {
                userId: 1,
                input: {
                    email: 'kmh@new.com',
                    verified: false,
                }
            }

            const newVerification = {
                code: 'code',
            }

            const newUser = {
                verified: false,
                email: editProfileArgs.input.email
            }

            userRepository.findOne.mockResolvedValue(oldUser);

            verificationRepository.create.mockReturnValue(newVerification)
            verificationRepository.save.mockResolvedValue(newVerification)

            await service.editProfile(editProfileArgs.userId, editProfileArgs.input);

            expect(userRepository.findOne).toHaveBeenCalledTimes(1);
            expect(userRepository.findOne).toHaveBeenCalledWith(editProfileArgs.userId);

            expect(verificationRepository.create).toHaveBeenCalledWith({ user: newUser });
            expect(verificationRepository.save).toHaveBeenCalledWith(newVerification);

            expect(mailService.sendVerificationEmail).toHaveBeenCalledWith(newUser.email, newVerification.code);

        })

        it("should hange password", async () => {
            const editProfileArgs = {
                userId: 1,
                input: { password: 'new.password' }
            }
            userRepository.findOne.mockResolvedValue({ password: 'old' });
            const result = await service.editProfile(editProfileArgs.userId, editProfileArgs.input);

            expect(userRepository.save).toHaveBeenCalledTimes(1);
            expect(userRepository.save).toHaveBeenCalledWith(editProfileArgs.input);

            expect(result).toEqual({ ok: true });
        })

        it("should fail on exception", async () => {
            const editProfileArgs = {
                userId: 1,
                input: { password: 'new.password' }
            }
            userRepository.findOne.mockRejectedValue(new Error());
            const result = await service.editProfile(editProfileArgs.userId, editProfileArgs.input);

            expect(result).toEqual({ ok: false, error: 'Could not update profile' });
        })
    });

    describe('verifyEmail', () => {
        it("should verify email.", async () => {
            const mockedVerification = {
                user: {
                    verified: false,
                },
                id: 1,
            }
            verificationRepository.findOne.mockResolvedValue(mockedVerification)
            const result = await service.verifyEmail("");

            expect(verificationRepository.findOne).toHaveBeenCalledTimes(1);
            expect(verificationRepository.findOne).toHaveBeenCalledWith(
                expect.any(Object),
                expect.any(Object)
            );

            expect(userRepository.save).toHaveBeenCalledTimes(1);
            expect(userRepository.save).toHaveBeenCalledWith({ verified: true, });

            expect(verificationRepository.delete).toHaveBeenCalledTimes(1);
            expect(verificationRepository.delete).toHaveBeenCalledWith(mockedVerification.id);

            expect(result).toEqual({ ok: true })
        });
        it("should fail on verification not found.", async () => {
            verificationRepository.findOne.mockResolvedValue(undefined);
            const result = await service.verifyEmail("");
            expect(result).toEqual({
                ok: false,
                error: "Verification not found."
            });
        });
        it("should fail on exception", async () => {
            verificationRepository.findOne.mockRejectedValue(new Error());
            const result = await service.verifyEmail("");
            expect(result).toEqual({
                ok: false,
                error: "Could not verify email."
            });
        });
    });
})