import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MediaService } from './media.service';
import { mediasProviders } from './media.providers';
import { DatabaseModule } from 'src/database/database.module';
import { MediaGateway } from './media.gateway';
import { CryptoUtil } from 'src/utils/crypto.util';

@Module({
  providers: [MediaService, MediaGateway, CryptoUtil, ...mediasProviders],
  exports: [MediaService, MediaGateway,],
  imports: [
    DatabaseModule,
    JwtModule.register({
      secretOrPrivateKey: 'secretKey',
    }),
  ],
})

export class MediaModule { }
