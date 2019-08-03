import { Module, Global } from '@nestjs/common';
import { ScheduleService } from './schedule.service';
import { PhoneUtil } from 'src/utils/phone.util';
import { DeviceModule } from 'src/module/device/device.module';
import { ResidentModule } from 'src/module/resident/resident.module';
import { FaceModule } from 'src/module/face/face.module';
import { CameraUtil } from 'src/utils/camera.util';
import { RoleModule } from 'src/module/role/role.module';
import { BlackModule } from 'src/module/black/black.module';
import { UserModule } from 'src/module/users/user.module';
import { WeixinUtil } from 'src/utils/weixin.util';
import { LogRecordModule } from 'src/module/logRecord/LogRecord.module';

@Global()
@Module({
  providers: [
    PhoneUtil,
    CameraUtil,
    WeixinUtil,
    ScheduleService,
  ],
  imports: [
    DeviceModule,
    ResidentModule,
    FaceModule,
    RoleModule,
    BlackModule,
    UserModule,
    LogRecordModule,
  ],
  exports: [ScheduleService],
})
export class ScheduleModule { }