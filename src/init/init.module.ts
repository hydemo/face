import { Module, Global } from '@nestjs/common';
import { InitService } from './init.service';
import { AdminModule } from 'src/module/admin/admin.module';
import { SOCUtil } from 'src/utils/soc.util';
import { CryptoUtil } from 'src/utils/crypto.util';
import { ConfigModule } from 'src/config/config.module';

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
  ],
  exports: [InitService],
})
export class InitModule { }