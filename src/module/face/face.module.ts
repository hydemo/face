import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { FaceService } from './face.service';
import { facesProviders } from './face.providers';
import { DatabaseModule } from 'src/database/database.module';

@Module({
  providers: [FaceService, ...facesProviders],
  exports: [FaceService],
  imports: [
    DatabaseModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
  ],
})

export class FaceModule { }
