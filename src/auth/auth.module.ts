import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthStrategy } from './auth.strategy';
import { AdminModule } from 'src/module/admin/admin.module';
import { UserModule } from 'src/module/users/user.module';

@Module({
  providers: [
    AuthService,
    AuthStrategy,
  ],
  imports: [
    AdminModule,
    UserModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secretOrPrivateKey: 'secretKey',
      signOptions: {
        expiresIn: 7 * 24 * 60 * 60,
      },
    }),
  ],
})

export class AuthModule { }
