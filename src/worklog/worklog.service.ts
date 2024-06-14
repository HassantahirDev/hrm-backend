import { HttpException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as ExcelJS from 'exceljs';
import * as fs from 'fs';

@Injectable()
export class WorkLogService {
  constructor(private prisma: PrismaService) {}

  async createWorkLog(userId: string) {
    const checkinTime = this.convertToPKT(new Date());
    const startOfDay = new Date(checkinTime);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(checkinTime);
    endOfDay.setHours(23, 59, 59, 999);

    console.log('startoftheday', startOfDay, 'endoftheday', endOfDay);

    // const existingWorkLog = await this.prisma.workLog.findFirst({
    //   where: {
    //     userId,
    //     checkinTime: {
    //       gte: startOfDay,
    //       lt: endOfDay,
    //     },
    //   },
    // });

    // if (existingWorkLog) {
    //   throw new HttpException('User has already checked in today', 403);
    // }

    const data = await this.prisma.workLog.create({
      data: {
        checkinTime,
        userId,
      },
    });
    await this.createWorkLogExcel(
      data.id,
      userId,
      data.checkinTime,
      data.checkoutTime,
      data.workingTime,
    );
    return data;
  }

  async createWorkLogExcel(
    workLogId: string,
    userId: string,
    checkinTime: Date,
    checkoutTime: Date,
    workingTime: number,
  ) {
    // const checkinDate = checkinTime.toDateString(); // Extract date
    // const checkinTimeOnly = checkinTime.toTimeString().split(' ')[0]; // Extract time

    // console.log('Checkin Date:', checkinDate);
    // console.log('Checkin Time:', checkinTimeOnly);

    const user = await this.prisma.user.findFirst({
      where: { userId: userId },
      select: {
        name: true,
        department: {
          select: {
            departmentName: true,
            teamLeader: true,
          },
        },
      },
    });

    const workbook = await this.loadWorkbook();
    const sheet = workbook.getWorksheet('WorkLogs');

    sheet.addRow([
      workLogId,
      userId,
      user.name,
      checkinTime,
      checkoutTime,
      workingTime,
      user.department.teamLeader,
      user.department.departmentName,
    ]);

    await this.saveWorkbook(workbook);
  }

  async UpdateWorkLogExcel(
    workLogId: string,
    userId: string,
    checkinTime: Date,
    checkoutTime: Date,
    workingTime: number,
  ) {
    // const checkinDate = checkinTime.toDateString(); // Extract date
    // const checkinTimeOnly = checkinTime.toTimeString().split(' ')[0]; // Extract time

    // console.log('Checkin Date:', checkinDate);
    // console.log('Checkin Time:', checkinTimeOnly);

    const user = await this.prisma.user.findFirst({
      where: { userId: userId },
      select: {
        name: true,
        department: {
          select: {
            departmentName: true,
            teamLeader: true,
          },
        },
      },
    });

    const workbook = await this.loadWorkbook();
    const sheet = workbook.getWorksheet('WorkLogs');

    let row = sheet.getRow(sheet.actualRowCount).number;
    for (let i = 2; i <= sheet.actualRowCount; i++) {
      if (sheet.getRow(i).getCell(1).value === workLogId) {
        row = i;
        break;
      }
    }

    if (row) {
      const existingRow = sheet.getRow(row);
      existingRow.getCell(1).value = workLogId;
      existingRow.getCell(2).value = userId;
      existingRow.getCell(3).value = user.name;
      (existingRow.getCell(4).value = checkinTime),
        (existingRow.getCell(5).value = checkoutTime),
        (existingRow.getCell(6).value = workingTime);
      existingRow.getCell(7).value = user.department.teamLeader;
      existingRow.getCell(8).value = user.department.departmentName;
      existingRow.commit();
    }
    await this.saveWorkbook(workbook);
  }

  private async loadWorkbook() {
    const workbook = new ExcelJS.Workbook();
    if (fs.existsSync('worklogs.xlsx')) {
      await workbook.xlsx.readFile('worklogs.xlsx');
      console.log('in if');
    } else {
      console.log('in else');
      const sheet = workbook.addWorksheet('WorkLogs');
      sheet.addRow([
        'WorkLogId',
        'UserId',
        'Name',
        'Checkin Time',
        'Checkout Time',
        'Working Time',
        'Team Leader',
        'Department Name',
      ]);
      await workbook.xlsx.writeFile('worklogs.xlsx');
    }
    return workbook;
  }

  private async saveWorkbook(workbook: ExcelJS.Workbook) {
    await workbook.xlsx.writeFile('worklogs.xlsx');
  }

  async updateCheckoutTime(userId: string, workLogId: string) {
    console.log(userId);
    const Time = this.convertToPKT(new Date());
    const startOfDay = new Date(Time);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(Time);
    endOfDay.setHours(23, 59, 59, 999);

    console.log('startoftheday', startOfDay, 'endoftheday', endOfDay);
    const existingCheckout = await this.prisma.workLog.findFirst({
      where: {
        userId: userId,
        id: workLogId,
        checkoutTime: {
          not: null,
        },
      },
    });

    if (existingCheckout) {
      var existingWorkLog = await this.prisma.workLog.findFirst({
        where: {
          userId: userId,
          checkoutTime: {
            gte: startOfDay,
            lt: endOfDay,
          },
        },
      });
    }
    if (existingWorkLog) {
      throw new HttpException('User has already checked out today', 403);
    }
    const checkoutTime = this.convertToPKT(new Date());
    const workingTime = await this.calculateWorkingTime(
      workLogId,
      checkoutTime,
    );

    const workLog = await this.prisma.workLog.update({
      where: { id: workLogId },
      data: {
        checkoutTime,
        workingTime: workingTime.minutes,
      },
    });

    // Update the corresponding row in the Excel sheet
    await this.UpdateWorkLogExcel(
      workLogId,
      userId,
      new Date(workLog.checkinTime),
      new Date(workLog.checkoutTime),
      workingTime.minutes,
    );

    return {
      ...workLog,
      formattedWorkingTime: this.formatWorkingTime(workingTime.minutes),
    };
  }

  private async calculateWorkingTime(
    workLogId: string,
    checkoutTime: Date,
  ): Promise<{ minutes: number }> {
    const workLog = await this.prisma.workLog.findUnique({
      where: { id: workLogId },
    });

    if (!workLog) {
      throw new Error('WorkLog not found');
    }

    const diffMs =
      checkoutTime.getTime() - new Date(workLog.checkinTime).getTime();
    const diffMins = diffMs / (1000 * 60);

    return { minutes: Math.round(diffMins) };
  }

  private formatWorkingTime(minutes: number): string {
    if (minutes < 60) {
      return `${minutes} minutes`;
    } else {
      const diffHours = minutes / 60;
      const roundedHours = Math.floor(diffHours);
      const remainingMins = Math.round((diffHours - roundedHours) * 60);
      const hourStr = roundedHours === 1 ? 'hour' : 'hours';
      return `${roundedHours} ${hourStr}${remainingMins > 0 ? ` ${remainingMins} min` : ''}`;
    }
  }

  private convertToPKT(date: Date): Date {
    const offset = 5 * 60 * 60 * 1000;
    return new Date(date.getTime() + offset);
  }

  async getWorkLogsByDate(date: string) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const workLogs = await this.prisma.workLog.findMany({
      where: {
        checkinTime: {
          gte: startOfDay,
          lt: endOfDay,
        },
      },
      include: {
        user: true,
      },
    });

    return workLogs.map((workLog) => ({
      ...workLog,
      formattedWorkingTime: this.formatWorkingTime(workLog.workingTime),
    }));
  }

  async getWorkLogsByUser(userId: string) {

    const workLogs = await this.prisma.workLog.findMany({
      where: {
        userId: userId
      },
      include: {
        user: {
          include:{
            department: true,
          }
        },
      },
    });

    return workLogs.map((workLog) => ({
      ...workLog,
      formattedWorkingTime: this.formatWorkingTime(workLog.workingTime),
    }));
  }

  async getWorkLogsByUserId(userId: string) {
    return this.prisma.workLog.findMany({
      where: {
        userId,
      },
      include: {
        user: true,
      },
    });
  }

  async getWorkLogsByName(name: string) {
    const userName = name;
    console.log(userName);
    return this.prisma.workLog.findMany({
      where: {
        user: {
          name: {
            equals: name,
            mode: 'insensitive',
          },
        },
      },
      include: {
        user: true,
      },
    });
  }

  async getWorkLogOfEmployeesByTeamLead(name: string) {
    console.log(name);
    return this.prisma.workLog.findMany({
      include: {
        user: {
          select: {
            name: true,
          },
        },
      },
      where: {
        user: {
          department: {
            teamLeader: {
              equals: name,
              mode: 'insensitive',
            },
          },
        },
      },
    });
  }

  async getWorkLogOfEmployeesByDepartmentName(name: string) {
    console.log(name);
    return this.prisma.workLog.findMany({
      include: {
        user: {
          select: {
            name: true,
          },
        },
      },
      where: {
        user: {
          department: {
            departmentName: {
              equals: name,
              mode: 'insensitive',
            },
          },
        },
      },
    });
  }

  private readonly filePath = 'worklogs.xlsx';

  async exportWorkLogsForDateExcel(date: string): Promise<string> {
    const workbook = new ExcelJS.Workbook();

    if (!fs.existsSync(this.filePath)) {
      throw new Error('Worklog file does not exist');
    }

    await workbook.xlsx.readFile(this.filePath);
    const sheet = workbook.getWorksheet('WorkLogs');

    const filteredRows = sheet.getRows(2, sheet.rowCount - 1).filter((row) => {
      const checkinDate = new Date(
        row.getCell(4).value as string,
      ).toDateString();
      return checkinDate === new Date(date).toDateString();
    });

    if (filteredRows.length === 0) {
      throw new Error('No worklogs found for the specified date');
    }

    const newWorkbook = new ExcelJS.Workbook();
    const newSheet = newWorkbook.addWorksheet('WorkLogs');

    newSheet.addRow([
      'WorkLogId',
      'UserId',
      'Name',
      'Checkin Time',
      'Checkout Time',
      'Working Time',
      'Team Leader',
      'Department Name',
    ]);

    filteredRows.forEach((row) => {
      const rowValues = row.values as Array<any>;
      const cellValues = rowValues.slice(1).map((cell) => {
        if (cell && typeof cell === 'object' && 'richText' in cell) {
          return cell.richText.map((textObj) => textObj.text).join('');
        } else if (cell && typeof cell === 'object' && 'text' in cell) {
          return cell.text;
        }
        return cell;
      });
      newSheet.addRow(cellValues);
    });

    const newFilePath = `worklogs_${date}.xlsx`;
    if (fs.existsSync(newFilePath)) {
      fs.unlinkSync(newFilePath);
    }

    await newWorkbook.xlsx.writeFile(newFilePath);

    return newFilePath;
  }

  async exportWorkLogsForTeamLeader(teamLeader: string): Promise<string> {
    const workbook = new ExcelJS.Workbook();

    if (!fs.existsSync(this.filePath)) {
      throw new Error('Worklog file does not exist');
    }

    await workbook.xlsx.readFile(this.filePath);
    const sheet = workbook.getWorksheet('WorkLogs');

    const filteredRows = sheet.getRows(2, sheet.rowCount - 1).filter(row => {
      return row.getCell(7).value === teamLeader;
    });

    if (filteredRows.length === 0) {
      throw new Error('No worklogs found for the specified team leader');
    }

    const newWorkbook = new ExcelJS.Workbook();
    const newSheet = newWorkbook.addWorksheet('WorkLogs');

    newSheet.addRow([
      'WorkLogId',
      'UserId',
      'Name',
      'Checkin Date',
      'Checkin Time',
      'Checkout Time',
      'Working Time',
      'Team Leader',
      'Department Name',
    ]);

    filteredRows.forEach(row => {
      const rowValues = row.values as Array<any>;
      const cellValues = rowValues.map(cell => {
        if (cell && typeof cell === 'object' && 'richText' in cell) {
          return cell.richText.map(textObj => textObj.text).join('');
        } else if (cell && typeof cell === 'object' && 'text' in cell) {
          return cell.text;
        }
        return cell;
      });
      newSheet.addRow(cellValues);
    });

    const newFilePath = `worklogs_${teamLeader}.xlsx`;

    // Delete the old file if it exists
    if (fs.existsSync(newFilePath)) {
      fs.unlinkSync(newFilePath);
    }

    await newWorkbook.xlsx.writeFile(newFilePath);

    return newFilePath;
  }
}
