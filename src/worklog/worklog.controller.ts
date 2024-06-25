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
import * as fs from 'fs';
import { WorkLogService } from './worklog.service';
import { JwtGuard } from 'src/auth/guard/jwt.guard';
import { TeamMemberDTO } from './dto/create-work-log.dto';
import { Response } from 'express';

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


  @Get('all')
  async getAllWorkLogs() {
    return this.workLogService.getAllWorkLogs();
  }

  @UseGuards(JwtGuard)
  @Get('by-date')
  async getWorkLogsByDate(@Query('date') date: string) {
    return this.workLogService.getWorkLogsByDate(date);
  }

  @UseGuards(JwtGuard)
  @Get('by-user')
  async getWorkLogsByUsER(@Req() req) {
    return this.workLogService.getWorkLogsByUser(req.user.userId);
  }

  @UseGuards(JwtGuard)
  @Post('team-member')
  async getWorkLogsByTeamMember(@Body() req: TeamMemberDTO) {
    return this.workLogService.getWorkLogsOfTeamMembers(req);
  }

  

  // @UseGuards(JwtGuard)
  // @Get('by-user/:userId')
  // async getWorkLogsByUserId(@Param('userId') userId: string) {
  //   return this.workLogService.getWorkLogsByUserId(userId);
  // }

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

  @Get('by-team-lead/excel/:teamLeader/:date?')
async exportWorkLogsForTeamLeader(
  @Param('teamLeader') teamLeader: string,
  @Param('date') date: string,
  @Res() res: Response,
) {
  const filePath = await this.workLogService.exportWorkLogsForTeamLeader(teamLeader, date);
  res.download(filePath, (err) => {
    if (err) {
      console.error('Error downloading file:', err);
      res.status(500).send('Error downloading file');
    } else {
      // Optionally delete the file after sending it to the client
      fs.unlink(filePath, (err) => {
        if (err) {
          console.error('Error deleting file:', err);
        }
      });
    }
  });
  return filePath;
}

@Get('export/all')
async exportAllWorkLogs(
  @Res() res: Response,
) {
  const filePath = 'worklogs.xlsx'
  res.download(filePath, (err) => {
    if (err) {
      console.error('Error downloading file:', err);
      res.status(500).send('Error downloading file');
    } else {
      fs.unlink(filePath, (err) => {
        if (err) {
          console.error('Error deleting file:', err);
        }
      });
    }
  });
  return filePath;
}

}
