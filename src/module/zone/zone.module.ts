import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { ZoneService } from './zone.service';
import { zonesProviders } from './zone.providers';
import { DatabaseModule } from 'src/database/database.module';
import { RoleModule } from '../role/role.module';
import { SOCUtil } from 'src/utils/soc.util';
import { CryptoUtil } from 'src/utils/crypto.util';
import { ZOCUtil } from 'src/utils/zoc.util';

@Module({
  providers: [
    ZoneService,
    SOCUtil,
    CryptoUtil,
    ZOCUtil,
    ...zonesProviders
  ],
  exports: [ZoneService],
  imports: [
    DatabaseModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
  ],
})

export class ZoneModule { }
