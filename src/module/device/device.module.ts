import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { DeviceService } from './device.service';
import { devicesProviders } from './device.providers';
import { DatabaseModule } from 'src/database/database.module';
import { ZoneModule } from '../zone/zone.module';
import { TaskModule } from '../task/task.module';

@Module({
  providers: [DeviceService, ...devicesProviders],
  exports: [DeviceService],
  imports: [
    DatabaseModule,
    ZoneModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
  ],
})

export class DeviceModule { }
