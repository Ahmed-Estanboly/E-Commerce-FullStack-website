import { Controller, Get, Param, Patch, Post, Request, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  list(@Request() req: { user: { sub: number } }) {
    return this.notificationsService.list(req.user.sub);
  }

  @Get('unread-count')
  unreadCount(@Request() req: { user: { sub: number } }) {
    return this.notificationsService.unreadCount(req.user.sub);
  }

  @Patch(':id/read')
  markRead(@Request() req: { user: { sub: number } }, @Param('id') id: string) {
    return this.notificationsService.markRead(req.user.sub, id);
  }

  @Post('read-all')
  markAllRead(@Request() req: { user: { sub: number } }) {
    return this.notificationsService.markAllRead(req.user.sub);
  }
}
