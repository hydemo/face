import { Module, } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { UserService } from './user.service';
import { usersProviders } from './user.providers';
import { DatabaseModule } from '@database/database.module';
import { CryptoUtil } from '@utils/crypto.util';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from 'src/config/config.module';
import { CameraUtil } from 'src/utils/camera.util';
import { DeviceModule } from '../device/device.module';
import { FaceModule } from '../face/face.module';
import { PhoneUtil } from 'src/utils/phone.util';


@Module({
  providers: [
    UserService,
    CryptoUtil,
    CameraUtil,
    PhoneUtil,
    ...usersProviders,
  ],
  exports: [UserService],
  imports: [
    ConfigModule,
    DeviceModule,
    FaceModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secretOrPrivateKey: 'secretKey',
      signOptions: {
        expiresIn: 7 * 24 * 60 * 60,
      },
    }),
    DatabaseModule,
  ],
})

export class UserModule { }
