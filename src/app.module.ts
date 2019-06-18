import { Module } from '@nestjs/common';
import { RedisModule } from 'nestjs-redis'
import { AuthModule } from './auth/auth.module';
import { DatabaseModule } from './database/database.module';
import { InitModule } from './init/init.module';
import { ScheduleModule } from './schedule/schedule.module';
import { CallbackController } from './controller/callback.controller';
import { CallbackModule } from './module/callback/callback.module';
import { QiniuUtil } from './utils/qiniu.util';
import { CameraUtil } from './utils/camera.util';
import { CMSDeviceController } from './controller/cms/device.controller';
import { UploadModule } from './upload/upload.module';
import { CMSAdminController } from './controller/cms/admin.controller';
import { CryptoUtil } from './utils/crypto.util';
import { CMSLoginController } from './controller/cms/login.controller';
import { UserController } from './controller/api/user.controller';
import { CMSZoneController } from './controller/cms/zone.controller';
import { CMSTaskController } from './controller/cms/task.controller';
import { ZoneModule } from './module/zone/zone.module';
import { DeviceModule } from './module/device/device.module';
import { TaskModule } from './module/task/task.module';
import { UserModule } from './module/users/user.module';
import { CMSUserController } from './controller/cms/user.controller';
import { FaceModule } from './module/face/face.module';
import { CMSFaceController } from './controller/cms/face.controller';
import { CMSOrbitController } from './controller/cms/orbit.controller';
import { CMSStrangerController } from './controller/cms/stranger.controller';
import { OrbitModule } from './module/orbit/orbit.module';
import { StrangerModule } from './module/stranger/stranger.module';
import { ConfigService } from './config/config.service';
import { PassportModule } from '@nestjs/passport';
import { ZoneController } from './controller/api/zone.controller';
import { ResidentController } from './controller/api/resident.controller';
import { CMSResidentController } from './controller/cms/resident.controller';
import { ResidentModule } from './module/resident/resident.module';
import { OrbitController } from './controller/api/orbit.controller';
import { WeixinUtil } from './utils/weixin.util';
import { WeixinController } from './controller/weixin.controller';
import { MessageModule } from './module/message/message.module';
import { MessageController } from './controller/api/message.controller';
import { RoleModule } from './module/role/role.module';
import { RoleController } from './controller/api/role.controller';
import { BlackModule } from './module/black/black.module';
import { RentModule } from './module/rent/rent.module';
import { TaskController } from './controller/api/task.controller';
import { CMSBlackController } from './controller/cms/black.controller';
import { SOCUtil } from './utils/soc.util';
import { MediaModule } from './module/media/media.module';
import { MediaGateway } from './module/media/media.gateway';
import { CMSMediaController } from './controller/cms/media.controller';
import { MediaController } from './controller/api/media.controller';

@Module({
  imports: [
    AuthModule,
    DatabaseModule,
    InitModule,
    ScheduleModule,
    UploadModule,
    CallbackModule,
    ZoneModule,
    DeviceModule,
    TaskModule,
    UserModule,
    FaceModule,
    OrbitModule,
    StrangerModule,
    ResidentModule,
    MessageModule,
    RoleModule,
    BlackModule,
    RentModule,
    MediaModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    RedisModule.forRootAsync({
      useFactory: (configService: ConfigService) => configService.redis,
      inject: [ConfigService]
    }),
  ],
  providers: [
    QiniuUtil,
    CameraUtil,
    CryptoUtil,
    WeixinUtil,
    SOCUtil,
  ],
  controllers: [
    CallbackController,
    CMSDeviceController,
    CMSAdminController,
    CMSLoginController,
    CMSZoneController,
    CMSTaskController,
    CMSUserController,
    CMSFaceController,
    CMSOrbitController,
    CMSStrangerController,
    CMSResidentController,
    CMSBlackController,
    CMSMediaController,
    ZoneController,
    UserController,
    ResidentController,
    OrbitController,
    WeixinController,
    MessageController,
    RoleController,
    TaskController,
    MediaController,
  ]
})
export class AppModule { }
