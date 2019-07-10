import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { RoleService } from './role.service';
import { rolesProviders } from './role.providers';
import { DatabaseModule } from 'src/database/database.module';
import { WeixinUtil } from 'src/utils/weixin.util';
import { RentModule } from '../rent/rent.module';
import { ZoneModule } from '../zone/zone.module';
import { DeviceModule } from '../device/device.module';
import { CameraUtil } from 'src/utils/camera.util';
import { ConfigModule } from 'src/config/config.module';
import { FaceModule } from '../face/face.module';
import { PhoneUtil } from 'src/utils/phone.util';

@Module({
  providers: [
    RoleService,
    WeixinUtil,
    CameraUtil,
    PhoneUtil,
    ...rolesProviders],
  exports: [RoleService],
  imports: [
    DatabaseModule,
    ZoneModule,
    DeviceModule,
    ConfigModule,
    FaceModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
  ],
})

export class RoleModule { }
