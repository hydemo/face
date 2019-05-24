import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { ResidentService } from './resident.service';
import { residentsProviders } from './resident.providers';
import { DatabaseModule } from 'src/database/database.module';
import { ZoneModule } from '../zone/zone.module';
import { UserModule } from '../users/user.module';
import { CameraUtil } from 'src/utils/camera.util';
import { FaceModule } from '../face/face.module';

@Module({
  providers: [
    ResidentService,
    CameraUtil,

    ...residentsProviders],
  exports: [ResidentService],
  imports: [
    DatabaseModule,
    ZoneModule,
    UserModule,
    FaceModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
  ],
})

export class ResidentModule { }
