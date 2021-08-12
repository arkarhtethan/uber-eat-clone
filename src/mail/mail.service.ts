import { Inject, Injectable } from '@nestjs/common';
import got from 'got';
import * as FormData from "form-data";
import { CONFIG_OPTIONS } from 'src/common/common.constant';
import { EmailVar, MailModuleOptions } from 'src/common/mail.interfaces';

@Injectable()
export class MailService {
    constructor(@Inject(CONFIG_OPTIONS) private readonly options: MailModuleOptions) { }

    private async sendEmail (
        subject: string,
        template: string,
        emailVars: EmailVar[]
    ) {
        const form = new FormData();
        form.append("from", `Arkar from Halal Myanmar <mailgun@${this.options.domain}>`);
        form.append("to", `kmh21423@gmail.com`);
        form.append("subject", subject);
        form.append("template", template);
        emailVars.forEach(eVar => form.append(`v:${eVar.key}`, eVar.value));
        try {

            const response = await got(`https://api.mailgun.net/v3/${this.options.domain}/messages`,
                {
                    method: "POST",
                    headers: {
                        "Authorization": `Basic ${Buffer.from(`api:${this.options.apiKey}`).toString("base64")}`
                    },
                    body: form,
                },
            )
        } catch (error) {
            console.log(error);
        }
    }

    sendVerificationEmail (email: string, code: string) {
        this.sendEmail(
            'Verify Your Email',
            'verify-email',
            [
                { key: "code", value: code },
                { key: "username", value: email },
            ]
        )
    }
}
