import { Test } from "@nestjs/testing";
import { UserService } from "./users.service";
import { getRepositoryToken } from "@nestjs/typeorm";
import { User } from "./entities/user.entity";
import { Verification } from "./entities/verification.entity";
import { JwtService } from "src/jwt/jwt.service";
import { MailService } from "src/mail/mail.service";
import { Repository } from "typeorm";

const mockRepository = () => ({
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    findOneOrFail: jest.fn(),
});

const mockJwtService = () => ({
    sign: jest.fn(() => 'signed-token-hehehe'),
    verify: jest.fn(),
});

const mockMailService = () => ({
    sendVerificationEmail: jest.fn(),
});

type MockRepository<T = any> = Partial<Record<keyof Repository<T>, jest.Mock>>;

describe("UserService", () => {

    let service: UserService;
    let usersRepository: MockRepository<User>;
    let verificationRepository: MockRepository<Verification>;
    let mailService: MailService;
    let jwtService: JwtService;

    beforeEach(async () => {
        const module = await Test.createTestingModule({
            providers: [
                UserService,
                {
                    provide: getRepositoryToken(User),
                    useValue: mockRepository()
                },
                {
                    provide: getRepositoryToken(Verification),
                    useValue: mockRepository()
                },
                {
                    provide: JwtService,
                    useValue: mockJwtService(),
                },
                {
                    provide: MailService,
                    useValue: mockMailService(),
                },
            ],
        }).compile();
        service = module.get<UserService>(UserService);
        mailService = module.get<MailService>(MailService);
        jwtService = module.get<JwtService>(JwtService);
        usersRepository = module.get(getRepositoryToken(User));
        verificationRepository = module.get(getRepositoryToken(Verification));
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe("createAccount", () => {

        const createAccountArgs = {
            email: 'user@mock.com',
            password: 'mock123',
            role: 0,
        };

        it('should fail if user exists', async () => {
            usersRepository.findOne.mockResolvedValue({
                id: 1,
                email: 'aalalalalallalalal',
            });
            const result = await service.createAccount(createAccountArgs);
            expect(result).toMatchObject({
                ok: false,
                error: "There is a user with that email already",
            });
        });

        it('should create a new user', async () => {
            usersRepository.findOne.mockResolvedValue(undefined);
            usersRepository.create.mockReturnValue(createAccountArgs);
            usersRepository.save.mockResolvedValue(createAccountArgs);
            verificationRepository.create.mockReturnValue({ user: createAccountArgs });
            verificationRepository.save.mockResolvedValue({ code: 'code' });
            const result = await service.createAccount(createAccountArgs);
            expect(usersRepository.create).toHaveBeenCalledTimes(1);
            expect(usersRepository.create).toHaveBeenCalledWith(createAccountArgs);
            expect(usersRepository.save).toHaveBeenCalledTimes(1);
            expect(usersRepository.save).toHaveBeenCalledWith(createAccountArgs);
            expect(verificationRepository.create).toHaveBeenCalledTimes(1);
            expect(verificationRepository.create).toHaveBeenCalledWith({ user: createAccountArgs, });
            expect(verificationRepository.save).toHaveBeenCalledTimes(1);
            expect(verificationRepository.save).toHaveBeenCalledWith({ user: createAccountArgs });
            expect(mailService.sendVerificationEmail).toHaveBeenCalledTimes(1);
            expect(mailService.sendVerificationEmail).toHaveBeenCalledWith(
                expect.any(String),
                expect.any(String),
            );
            expect(result).toEqual({ ok: true });
        });

        it('should fail on exception', async () => {
            usersRepository.findOne.mockRejectedValue(new Error('Mock error'));
            const result = await service.createAccount(createAccountArgs);
            expect(result).toEqual({
                ok: false,
                error: "Couldn't create account"
            });
        });
    });

    describe('login', () => {

        const loginArgs = {
            email: 'user@mock.com',
            password: 'mockpass',
        }

        it('should fail if user does not exist', async () => {
            usersRepository.findOne.mockResolvedValue(null);
            const result = await service.login(loginArgs);

            expect(usersRepository.findOne).toHaveBeenCalledTimes(1);
            expect(usersRepository.findOne).toHaveBeenCalledWith(
                expect.any(Object),
                expect.any(Object),
            );
            expect(result).toEqual({
                ok: false,
                error: 'User not found'
            });
        });

        it('should fail if the password is wrong', async () => {
            const mockedUser = {
                id: 1,
                checkPassword: jest.fn(() => Promise.resolve(false)),
            };
            usersRepository.findOne.mockResolvedValue(mockedUser);
            const result = await service.login(loginArgs);
            expect(result).toEqual({ ok: false, error: 'Wrong password' });
        });

        it('should return token if the password is correct', async () => {
            const mockedUser = {
                id: 1,
                checkPassword: jest.fn(() => Promise.resolve(true)),
            };
            usersRepository.findOne.mockResolvedValue(mockedUser);

            const result = await service.login(loginArgs);
            expect(jwtService.sign).toHaveBeenCalledTimes(1);
            expect(jwtService.sign).toHaveBeenCalledWith(expect.any(Number));
            expect(result).toEqual({
                ok: true,
                token: 'signed-token-hehehe',
            });
        });

        it('should fail on exception', async () => {
            usersRepository.findOne.mockRejectedValue(new Error());
            const result = await service.login(loginArgs);
            expect(result).toEqual({
                ok: false,
                error: 'Can\'t login',
            })
        });
    });

    describe('findById', () => {
        const user = {
            id: 1,
            email: 'user@mock.com',
            password: 'mockpass',
        };

        it('should find an existing user', async () => {
            usersRepository.findOneOrFail.mockResolvedValue(user);
            const result = await service.findById(1);
            expect(result).toEqual({
                ok: true,
                user
            });
        });

        it('should fail if no user is found', async () => {
            usersRepository.findOneOrFail.mockRejectedValue(new Error());
            const result = await service.findById(1);
            expect(result).toEqual({
                ok: false,
                error: 'User Not Found'
            });
        });
    });

    describe('editProfile', () => {

        it('should change email', async () => {
            const oldUser = {
                email: 'bs@old.com',
                verified: true
            };
            const editprofileArgs = {
                userId: 1,
                input: { email: 'bs@new.com' },
            };
            const newVerification = {
                code: 'code',
            };
            const newUser = {
                verified: false,
                email: editprofileArgs.input.email
            }

            usersRepository.findOne.mockResolvedValue(oldUser);
            verificationRepository.create.mockReturnValue(newVerification);
            verificationRepository.save.mockReturnValue(newVerification);

            const result = await service.editProfile(editprofileArgs.userId, editprofileArgs.input);

            expect(usersRepository.findOne).toHaveBeenCalledTimes(1);
            expect(usersRepository.findOne).toHaveBeenCalledWith(editprofileArgs.userId);

            expect(verificationRepository.create).toHaveBeenCalledTimes(1);
            expect(verificationRepository.create).toHaveBeenCalledWith({ user: newUser });

            expect(verificationRepository.save).toHaveBeenCalledTimes(1);
            expect(verificationRepository.save).toHaveBeenCalledWith(newVerification);

            expect(mailService.sendVerificationEmail).toHaveBeenCalledTimes(1);
            expect(mailService.sendVerificationEmail).toHaveBeenCalledWith(newUser.email, newVerification.code);

            expect(result).toEqual({ok: true});
        });

        it('should change password', async () => {

            const editprofileArgs = {
                userId: 1,
                input: { password: 'newpass' },
            };

            usersRepository.findOne.mockResolvedValue({password: 'oldpass'});

            const result = await service.editProfile(editprofileArgs.userId, editprofileArgs.input);

            expect(usersRepository.save).toHaveBeenCalledTimes(1);
            expect(usersRepository.save).toHaveBeenCalledWith(editprofileArgs.input);

            expect(result).toEqual({ok: true});
        });

        it('should fail on exception', async () => {
            usersRepository.findOne.mockRejectedValue(new Error());
            const result = await service.editProfile(1, {email:'fail@mock.com'});
            expect(result).toEqual({
                ok: false,
                error: 'Could not update profile'
            });
        });
    });

    it.todo('verifyEmail');
});

