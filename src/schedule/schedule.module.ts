import { Module, Global } from '@nestjs/common';
import { ScheduleService } from './schedule.service';

@Global()
@Module({
  providers: [
    ScheduleService,
  ],
  imports: [
  ],
  exports: [ScheduleService],
})
export class ScheduleModule { }