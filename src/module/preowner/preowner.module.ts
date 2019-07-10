import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { PreownerService } from './preowner.service';
import { PreownersProviders } from './preowner.providers';
import { DatabaseModule } from 'src/database/database.module';
import { DeviceModule } from '../device/device.module';
import { XLSXUtil } from 'src/utils/xlsx.util';

@Module({
  providers: [PreownerService, XLSXUtil, ...PreownersProviders],
  exports: [PreownerService],
  imports: [
    DatabaseModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
  ],
})

export class PreownerModule { }
