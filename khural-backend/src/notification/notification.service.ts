import { Injectable } from '@nestjs/common';
import { EmailService } from '../email/email.service';

export enum NotificationType {
  EMAIL = 'email',
  // Add more notification types here (e.g., SMS, PUSH, etc.)
}

export interface NotificationOptions {
  type: NotificationType;
  recipient: string;
  subject?: string;
  data: any;
}

@Injectable()
export class NotificationService {
  constructor(private readonly emailService: EmailService) {}

  async sendNotification(options: NotificationOptions): Promise<void> {
    switch (options.type) {
      case NotificationType.EMAIL:
        await this.handleEmailNotification(options);
        break;
      // Add more notification type handlers here
      default:
        throw new Error(`Unsupported notification type: ${options.type}`);
    }
  }

  private async handleEmailNotification(options: NotificationOptions): Promise<void> {
    const { recipient, subject, data } = options;

    switch (data.template) {
      case 'welcome':
        await this.emailService.sendWelcomeEmail(recipient, data.name);
        break;
      case 'password-reset':
        await this.emailService.sendPasswordResetEmail(recipient, data.resetToken);
        break;
      // Add more email templates here
      default:
        throw new Error(`Unsupported email template: ${data.template}`);
    }
  }
} 