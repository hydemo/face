import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { BlackService } from './black.service';
import { blacksProviders } from './black.providers';
import { DatabaseModule } from 'src/database/database.module';
import { CameraUtil } from 'src/utils/camera.util';
import { RoleModule } from '../role/role.module';
import { DeviceModule } from '../device/device.module';
import { ConfigModule } from 'src/config/config.module';
import { FaceModule } from '../face/face.module';

@Module({
  providers: [BlackService, CameraUtil, ...blacksProviders],
  exports: [BlackService],
  imports: [
    DatabaseModule,
    RoleModule,
    DeviceModule,
    ConfigModule,
    FaceModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
  ],
})

export class BlackModule { }
