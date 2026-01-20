import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Notification, NotificationType, NotificationStatus } from '../../entities/notification.entity';
import * as nodemailer from 'nodemailer';

interface CreateNotificationDto {
  type: NotificationType;
  productId?: number;
  competitorId?: number;
  title: string;
  message: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  private emailTransporter: nodemailer.Transporter | null = null;

  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    private configService: ConfigService,
  ) {
    this.initializeEmailTransporter();
  }

  private initializeEmailTransporter(): void {
    const emailEnabled = this.configService.get('NOTIFICATION_EMAIL_ENABLED', 'false') === 'true';
    
    if (emailEnabled) {
      this.emailTransporter = nodemailer.createTransport({
        host: this.configService.get('SMTP_HOST'),
        port: this.configService.get('SMTP_PORT', 587),
        secure: false,
        auth: {
          user: this.configService.get('SMTP_USER'),
          pass: this.configService.get('SMTP_PASS'),
        },
      });
      this.logger.log('Email transporter initialized');
    }
  }

  async createNotification(dto: CreateNotificationDto): Promise<Notification> {
    const notification = this.notificationRepository.create({
      ...dto,
      status: NotificationStatus.PENDING,
    });

    const saved = await this.notificationRepository.save(notification);

    // Xabarnomani yuborish
    await this.sendNotification(saved);

    return saved;
  }

  private async sendNotification(notification: Notification): Promise<void> {
    try {
      // Email xabarnomasi
      if (this.emailTransporter) {
        await this.sendEmailNotification(notification);
      }

      // Bu yerda boshqa xabarnoma turlarini qo'shish mumkin (SMS, Telegram, va h.k.)

      notification.status = NotificationStatus.SENT;
      notification.sentAt = new Date();
      await this.notificationRepository.save(notification);
    } catch (error) {
      this.logger.error(`Failed to send notification ${notification.id}: ${error.message}`);
      notification.status = NotificationStatus.FAILED;
      await this.notificationRepository.save(notification);
    }
  }

  private async sendEmailNotification(notification: Notification): Promise<void> {
    if (!this.emailTransporter) return;

    // Bu yerda haqiqiy email manzilini olib kelish kerak (foydalanuvchi sozlamalaridan)
    // Hozircha faqat struktura
    const to = this.configService.get('NOTIFICATION_EMAIL_TO', 'admin@marketguard.com');
    const from = this.configService.get('NOTIFICATION_EMAIL_FROM', 'noreply@marketguard.com');

    await this.emailTransporter.sendMail({
      from,
      to,
      subject: notification.title,
      html: `
        <h2>${notification.title}</h2>
        <p>${notification.message}</p>
        ${notification.metadata ? `<pre>${JSON.stringify(notification.metadata, null, 2)}</pre>` : ''}
      `,
    });
  }

  async findAll(status?: NotificationStatus) {
    const where = status ? { status } : {};
    return await this.notificationRepository.find({
      where,
      order: { createdAt: 'DESC' },
      take: 100,
    });
  }

  async markAsRead(id: number) {
    await this.notificationRepository.update(id, {
      isRead: true,
      readAt: new Date(),
    });
    return await this.notificationRepository.findOne({ where: { id } });
  }
}
