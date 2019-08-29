import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { LogRecordService } from './logRecord.service';
import { DatabaseModule } from 'src/database/database.module';
import { logRecordProviders } from './logRecord.providers';
import { ConfigModule } from 'src/config/config.module';
import { UserModule } from '../users/user.module';
import { ResidentModule } from '../resident/resident.module';

@Module({
  providers: [LogRecordService, ...logRecordProviders],
  exports: [LogRecordService],
  imports: [
    DatabaseModule,
    ConfigModule,
    UserModule,
    ResidentModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
  ],
})

export class LogRecordModule { }
