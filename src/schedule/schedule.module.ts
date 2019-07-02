import { Module, Global } from '@nestjs/common';
import { ScheduleService } from './schedule.service';
import { PhoneUtil } from 'src/utils/phone.util';
import { DeviceModule } from 'src/module/device/device.module';
import { ResidentModule } from 'src/module/resident/resident.module';

@Global()
@Module({
  providers: [
    PhoneUtil,
    ScheduleService,
  ],
  imports: [
    DeviceModule,
    ResidentModule,
  ],
  exports: [ScheduleService],
})
export class ScheduleModule { }