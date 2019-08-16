import { Module, forwardRef } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { SchoolService } from './school.service';
import { schoolsProviders } from './school.providers';
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
    SchoolService,
    CameraUtil,
    WeixinUtil,
    PhoneUtil,
    ZOCUtil,
    SOCUtil,
    CryptoUtil,
    ...schoolsProviders
  ],
  exports: [SchoolService],
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

export class SchoolModule { }
