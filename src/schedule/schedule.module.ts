import { Module, Global } from '@nestjs/common';
import { ScheduleService } from './schedule.service';
import { PhoneUtil } from 'src/utils/phone.util';
import { DeviceModule } from 'src/module/device/device.module';
import { ResidentModule } from 'src/module/resident/resident.module';
import { FaceModule } from 'src/module/face/face.module';
import { CameraUtil } from 'src/utils/camera.util';

@Global()
@Module({
  providers: [
    PhoneUtil,
    CameraUtil,
    ScheduleService,
  ],
  imports: [
    DeviceModule,
    ResidentModule,
    FaceModule,
  ],
  exports: [ScheduleService],
})
export class ScheduleModule { }