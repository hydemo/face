import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AdminService } from './admin.service';
import { adminsProviders } from './admin.providers';
import { DatabaseModule } from '@database/database.module';
import { CryptoUtil } from '@utils/crypto.util';
import { ConfigModule } from 'src/config/config.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
  providers: [
    AdminService,
    CryptoUtil,
    ...adminsProviders,
  ],
  exports: [AdminService],
  imports: [
    JwtModule.register({
      secretOrPrivateKey: 'secretKey',
      signOptions: {
        expiresIn: 7 * 24 * 60 * 60,
      },
    }),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    DatabaseModule,
  ],
})

export class AdminModule { }
