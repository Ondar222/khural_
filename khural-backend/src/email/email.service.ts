import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('SMTP_HOST'),
      port: this.configService.get<number>('SMTP_PORT'),
      secure: this.configService.get<boolean>('SMTP_SECURE'),
      auth: {
        user: this.configService.get<string>('SMTP_USER'),
        pass: this.configService.get<string>('SMTP_PASS'),
      },
    });
  }

  async sendWelcomeEmail(to: string, name: string): Promise<void> {
    const subject = 'Welcome to Our Platform';
    const html =
      `<h1>Welcome ${name}!</h1>
      <p>Thank you for registering with us. We're excited to have you on board!</p>
      <p>If you have any questions, feel free to reach out to our support team.</p>`;

    await this.sendEmail(to, subject, html);
  }

  async sendPasswordResetEmail(to: string, resetToken: string): Promise<void> {
    const subject = 'Password Reset Request';
    const resetUrl = `${this.configService.get<string>('FRONTEND_URL')}/reset-password?token=${resetToken}`;
    const html = `
      <h1>Password Reset Request</h1>
      <p>You requested to reset your password. Click the link below to proceed:</p>
      <a href="${resetUrl}">Reset Password</a>
      <p>If you didn't request this, please ignore this email.</p>
      <p>This link will expire in 1 hour.</p>
    `;

    await this.sendEmail(to, subject, html);
  }

  async sendEmail(to: string, subject: string, html: string): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: this.configService.get<string>('SMTP_FROM'),
        to,
        subject,
        html,
      });
    } catch (error) {
      console.error('Error sending email:', error);
      // Проверяем, настроен ли SMTP (если переменные окружения не установлены, не выбрасываем ошибку)
      const smtpHost = this.configService.get<string>('SMTP_HOST');
      if (!smtpHost) {
        console.warn('SMTP not configured, skipping email send');
        return;
      }
      throw new Error('Failed to send email');
    }
  }
} 