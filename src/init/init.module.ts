import { Module, Global } from '@nestjs/common';
import { InitService } from './init.service';
import { AdminModule } from 'src/module/admin/admin.module';
import { SOCUtil } from 'src/utils/soc.util';
import { CryptoUtil } from 'src/utils/crypto.util';

@Global()
@Module({
  providers: [
    SOCUtil,
    CryptoUtil,
    InitService,
  ],
  imports: [
    AdminModule,
  ],
  exports: [InitService],
})
export class InitModule { }