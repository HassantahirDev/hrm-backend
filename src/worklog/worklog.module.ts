import { Module } from '@nestjs/common';
import { WorkLogController } from './worklog.controller';
import { WorkLogService } from './worklog.service';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [WorkLogController],
  providers: [WorkLogService]
})
export class WorkLogModule {}
