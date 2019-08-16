import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { ContactService } from './contact.service';
import { contactsProviders } from './contact.providers';
import { DatabaseModule } from 'src/database/database.module';
import { DeviceModule } from '../device/device.module';
import { ConfigModule } from 'src/config/config.module';
import { UserModule } from '../users/user.module';
import { WeixinUtil } from 'src/utils/weixin.util';

@Module({
  providers: [ContactService, WeixinUtil, ...contactsProviders],
  exports: [ContactService],
  imports: [
    DatabaseModule,
    DeviceModule,
    ConfigModule,
    UserModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
  ],
})

export class ContactModule { }
