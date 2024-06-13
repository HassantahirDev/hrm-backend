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
  Res,
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
  async checkout(@Param('id') id: string, @Req() req) {
    return this.workLogService.updateCheckoutTime(req.user.userId, id);
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

  @Get('by-team-leader/:name')
  async getWorkLogOfEmployeesByTeamLead(@Query('name') name: string) {
    return this.workLogService.getWorkLogOfEmployeesByTeamLead(name);
  }

  @Get('by-department-name/:name')
  async getWorkLogOfEmployeesByDepartmentName(@Param('name') name: string) {
    return this.workLogService.getWorkLogOfEmployeesByDepartmentName(name);
  }

  @Get('by-date/excel')
  async exportWorkLogsForDate(@Query('date') date: string) {
    const filePath = await this.workLogService.exportWorkLogsForDateExcel(date);
    return filePath;
  }
}
