import { Module } from '@nestjs/common';
import { CallbackService } from './callback.service';
import { UserModule } from '../users/user.module';
import { DeviceModule } from '../device/device.module';
import { OrbitModule } from '../orbit/orbit.module';
import { StrangerModule } from '../stranger/stranger.module';
import { QiniuUtil } from 'src/utils/qiniu.util';
import { MessageModule } from '../message/message.module';
import { ResidentModule } from '../resident/resident.module';


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
    MessageModule,
    ResidentModule,
  ],
})

export class CallbackModule { }
