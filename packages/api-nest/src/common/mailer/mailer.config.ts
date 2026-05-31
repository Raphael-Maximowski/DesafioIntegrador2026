import { join } from 'path';
import type { MailerOptions } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/adapters/handlebars.adapter';

export const mailerConfig = (): MailerOptions => ({
  transport: {
    host: process.env.SMTP_HOST ?? 'localhost',
    port: Number(process.env.SMTP_PORT ?? 1025),
    secure: false,
  },
  defaults: {
    from: process.env.MAIL_FROM ?? 'no-reply@desafio.local',
  },
  template: {
    dir: join(__dirname, 'templates'),
    adapter: new HandlebarsAdapter(),
    options: { strict: true },
  },
});
