import {
  Controller,
  Post,
  Patch,
  Body,
  Param,
  Get,
  UseGuards,
  Req,
  Query,
} from '@nestjs/common';
import { WorkLogService } from './worklog.service';
import { JwtGuard } from 'src/auth/guard/jwt.guard';

@Controller('work-log')
export class WorkLogController {
  constructor(private readonly workLogService: WorkLogService) {}

  @UseGuards(JwtGuard)
  @Get('checkin')
  async checkin(@Req() req) {
    return this.workLogService.createWorkLog(req.user.userId);
  }

  @UseGuards(JwtGuard)
  @Patch('checkout/:id')
  async checkout(@Param('id') id: string) {
    return this.workLogService.updateCheckoutTime(id);
  }

  @UseGuards(JwtGuard)
  @Get('by-date')
  async getWorkLogsByDate(@Query('date') date: string) {
    return this.workLogService.getWorkLogsByDate(date);
  }

  @UseGuards(JwtGuard)
  @Get('by-user/:userId')
  async getWorkLogsByUserId(@Param('userId') userId: string) {
    return this.workLogService.getWorkLogsByUserId(userId);
  }

  @Get('by-name/:name')
  async getWorkLogsByUsername(@Param('name') username: string) {
    return this.workLogService.getWorkLogsByName(username);
  }
}
