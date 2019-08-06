import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AreaService } from './area.service';
import { areasProviders } from './area.providers';
import { DatabaseModule } from 'src/database/database.module';
import { DeviceModule } from '../device/device.module';

@Module({
  providers: [AreaService, ...areasProviders],
  exports: [AreaService],
  imports: [
    DatabaseModule,
    DeviceModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
  ],
})

export class AreaModule { }
