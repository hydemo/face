import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { ResidentService } from './resident.service';
import { residentsProviders } from './resident.providers';
import { DatabaseModule } from 'src/database/database.module';
import { ZoneModule } from '../zone/zone.module';
import { UserModule } from '../users/user.module';
import { CameraUtil } from 'src/utils/camera.util';
import { FaceModule } from '../face/face.module';
import { WeixinUtil } from 'src/utils/weixin.util';
import { RoleModule } from '../role/role.module';
import { ConfigModule } from 'src/config/config.module';
import { PhoneUtil } from 'src/utils/phone.util';
import { PreownerModule } from '../preowner/preowner.module';
import { ZOCUtil } from 'src/utils/zoc.util';
import { SOCUtil } from 'src/utils/soc.util';
import { CryptoUtil } from 'src/utils/crypto.util';

@Module({
  providers: [
    ResidentService,
    CameraUtil,
    WeixinUtil,
    PhoneUtil,
    ZOCUtil,
    SOCUtil,
    CryptoUtil,
    ...residentsProviders
  ],
  exports: [ResidentService],
  imports: [
    DatabaseModule,
    ZoneModule,
    UserModule,
    FaceModule,
    RoleModule,
    ConfigModule,
    PreownerModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
  ],
})

export class ResidentModule { }
