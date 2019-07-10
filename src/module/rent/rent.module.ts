import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { RentService } from './rent.service';
import { rentsProviders } from './rent.providers';
import { DatabaseModule } from 'src/database/database.module';
import { CameraUtil } from 'src/utils/camera.util';
import { WeixinUtil } from 'src/utils/weixin.util';
import { ResidentModule } from '../resident/resident.module';
import { PhoneUtil } from 'src/utils/phone.util';

@Module({
  providers: [RentService, CameraUtil, WeixinUtil, PhoneUtil, ...rentsProviders],
  exports: [RentService],
  imports: [
    DatabaseModule,
    ResidentModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
  ],
})

export class RentModule { }
