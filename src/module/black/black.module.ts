import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { BlackService } from './black.service';
import { blacksProviders } from './black.providers';
import { DatabaseModule } from 'src/database/database.module';
import { CameraUtil } from 'src/utils/camera.util';
import { RoleModule } from '../role/role.module';

@Module({
  providers: [BlackService, CameraUtil, ...blacksProviders],
  exports: [BlackService],
  imports: [
    DatabaseModule,
    RoleModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
  ],
})

export class BlackModule { }
