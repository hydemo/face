import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { DeviceService } from './device.service';
import { devicesProviders } from './device.providers';
import { DatabaseModule } from 'src/database/database.module';
import { ZoneModule } from '../zone/zone.module';
import { TaskModule } from '../task/task.module';
import { CryptoUtil } from 'src/utils/crypto.util';
import { ZOCUtil } from 'src/utils/zoc.util';
import { ConfigModule } from 'src/config/config.module';
import { SOCUtil } from 'src/utils/soc.util';
import { CameraUtil } from 'src/utils/camera.util';
import { PhoneUtil } from 'src/utils/phone.util';

@Module({
  providers: [
    DeviceService,
    CryptoUtil,
    ZOCUtil,
    SOCUtil,
    CameraUtil,
    PhoneUtil,
    ...devicesProviders],
  exports: [DeviceService],
  imports: [
    DatabaseModule,
    ZoneModule,
    ConfigModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
  ],
})

export class DeviceModule { }
