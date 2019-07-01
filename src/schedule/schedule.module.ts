import { Module, Global } from '@nestjs/common';
import { ScheduleService } from './schedule.service';
import { PhoneUtil } from 'src/utils/phone.util';
import { DeviceModule } from 'src/module/device/device.module';

@Global()
@Module({
  providers: [
    PhoneUtil,
    ScheduleService,
  ],
  imports: [
    DeviceModule,
  ],
  exports: [ScheduleService],
})
export class ScheduleModule { }