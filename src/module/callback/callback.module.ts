import { Module } from '@nestjs/common';
import { CallbackService } from './callback.service';
import { UserModule } from '../users/user.module';
import { DeviceModule } from '../device/device.module';
import { OrbitModule } from '../orbit/orbit.module';
import { StrangerModule } from '../stranger/stranger.module';
import { QiniuUtil } from 'src/utils/qiniu.util';
import { MessageModule } from '../message/message.module';
import { ResidentModule } from '../resident/resident.module';
import { MediaModule } from '../media/media.module';
import { WeixinUtil } from 'src/utils/weixin.util';
import { ZOCUtil } from 'src/utils/zoc.util';
import { CameraUtil } from 'src/utils/camera.util';
import { SOCUtil } from 'src/utils/soc.util';
import { ZoneModule } from '../zone/zone.module';
import { CryptoUtil } from 'src/utils/crypto.util';
import { PhoneUtil } from 'src/utils/phone.util';
import { ConfigModule } from 'src/config/config.module';
import { RoleModule } from '../role/role.module';
import { SchoolModule } from '../school/school.module';


@Module({
  providers: [
    QiniuUtil,
    WeixinUtil,
    ZOCUtil,
    CameraUtil,
    SOCUtil,
    CryptoUtil,
    PhoneUtil,
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
    MediaModule,
    ConfigModule,
    ZoneModule,
    RoleModule,
    SchoolModule,
  ],
})

export class CallbackModule { }
