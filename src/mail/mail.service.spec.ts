import { Test } from "@nestjs/testing";
import { CONFIG_OPTIONS } from "src/common/common.constant";
import { MailService } from "./mail.service"
import got from 'got';
import * as FormData from "form-data";


jest.mock('got')
jest.mock('form-data')

const TEST_DOMAIN = "TEST_DOMAIN";

describe("MailServie", () => {
    let service: MailService;
    beforeEach(async () => {
        const module = await Test.createTestingModule({
            providers: [MailService, {
                provide: CONFIG_OPTIONS,
                useValue: {
                    apiKey: "TEST_API_KEY",
                    domain: TEST_DOMAIN,
                    fromEmail: 'TEST_FROM_EMAIL'
                }
            }]
        }).compile()
        service = module.get<MailService>(MailService);
    })
    it("should be defined", () => {
        expect(service).toBeDefined();
    })
    describe("sendVerificationEmail", () => {
        it("should call sendEmail", () => {
            const sendVerificationEmailArgs = {
                email: 'email',
                code: 'code',
            };
            jest.spyOn(service, 'sendEmail').mockImplementation(async () => {
                return true;
            });
            service.sendVerificationEmail(
                sendVerificationEmailArgs.email,
                sendVerificationEmailArgs.code
            )
            expect(service.sendEmail).toHaveBeenCalledTimes(1);
            expect(service.sendEmail).toHaveBeenCalledWith(
                'Verify Your Email',
                'verify-email',
                [
                    { key: "code", value: sendVerificationEmailArgs.code },
                    { key: "username", value: sendVerificationEmailArgs.email },
                ]
            );
        })
    });
    describe("sendEmail", () => {
        it("sends email", async () => {
            const ok = await service.sendEmail('', '', []);
            const formSpy = jest.spyOn(FormData.prototype, "append");
            expect(formSpy).toHaveBeenCalled();
            expect(got.post).toHaveBeenCalledTimes(1);
            expect(got.post).toHaveBeenCalledWith(`https://api.mailgun.net/v3/${TEST_DOMAIN}/messages`, expect.any(Object));
            expect(ok).toEqual(true);
        });
        it("fail on error", async () => {
            jest.spyOn(got, 'post').mockImplementation(() => {
                throw new Error();
            });
            const ok = await service.sendEmail('', '', []);
            expect(ok).toEqual(false);
        })
    });
})