import type { MailerOptions } from '@nestjs-modules/mailer';

export const mailerConfig = (): MailerOptions => ({
  transport: {
    host: process.env.SMTP_HOST ?? 'localhost',
    port: Number(process.env.SMTP_PORT ?? 1025),
    secure: false,
  },
  defaults: {
    from: process.env.MAIL_FROM ?? 'no-reply@desafio.local',
  },
});
