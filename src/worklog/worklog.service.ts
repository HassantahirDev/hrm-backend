import { HttpException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

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

    const existingWorkLog = await this.prisma.workLog.findFirst({
      where: {
        userId,
        checkinTime: {
          gte: startOfDay,
          lt: endOfDay,
        },
      },
    });

    if (existingWorkLog) {
      throw new HttpException('User has already checked in today', 403);
    }

    return this.prisma.workLog.create({
      data: {
        checkinTime,
        userId,
      },
    });
  }

  async updateCheckoutTime(workLogId: string) {
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
}
