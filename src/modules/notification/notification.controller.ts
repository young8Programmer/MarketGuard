import { Controller, Get, Post, Param, Query } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationStatus } from '../../entities/notification.entity';

@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  async findAll(@Query('status') status?: NotificationStatus) {
    return await this.notificationService.findAll(status);
  }

  @Post(':id/read')
  async markAsRead(@Param('id') id: number) {
    return await this.notificationService.markAsRead(id);
  }
}
