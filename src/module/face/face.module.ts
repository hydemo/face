import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { FaceService } from './face.service';
import { facesProviders } from './face.providers';
import { DatabaseModule } from 'src/database/database.module';
import { CameraUtil } from 'src/utils/camera.util';

@Module({
  providers: [FaceService, CameraUtil, ...facesProviders],
  exports: [FaceService],
  imports: [
    DatabaseModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
  ],
})

export class FaceModule { }
