import { Module } from '@nestjs/common';
import { CallbackService } from './callback.service';
import { UserModule } from '../users/user.module';
import { DeviceModule } from '../device/device.module';
import { OrbitModule } from '../orbit/orbit.module';
import { StrangerModule } from '../stranger/stranger.module';
import { QiniuUtil } from 'src/utils/qiniu.util';


@Module({
  providers: [
    QiniuUtil,
    CallbackService
  ],
  exports: [CallbackService],
  imports: [
    UserModule,
    DeviceModule,
    OrbitModule,
    StrangerModule,
  ],
})

export class CallbackModule { }
