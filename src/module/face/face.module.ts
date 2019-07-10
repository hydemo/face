import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { FaceService } from './face.service';
import { facesProviders } from './face.providers';
import { DatabaseModule } from 'src/database/database.module';
import { CameraUtil } from 'src/utils/camera.util';
import { PhoneUtil } from 'src/utils/phone.util';

@Module({
  providers: [FaceService, CameraUtil, PhoneUtil, ...facesProviders],
  exports: [FaceService],
  imports: [
    DatabaseModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
  ],
})

export class FaceModule { }
