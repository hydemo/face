import { Module, Global } from '@nestjs/common';
import { InitService } from './init.service';
import { AdminModule } from 'src/module/admin/admin.module';
import { SOCUtil } from 'src/utils/soc.util';
import { CryptoUtil } from 'src/utils/crypto.util';
import { ConfigModule } from 'src/config/config.module';
import { UserModule } from 'src/module/users/user.module';

@Global()
@Module({
  providers: [
    SOCUtil,
    CryptoUtil,
    InitService,
  ],
  imports: [
    AdminModule,
    ConfigModule,
    UserModule,
  ],
  exports: [InitService],
})
export class InitModule { }