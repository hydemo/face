import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { RoleService } from './role.service';
import { rolesProviders } from './role.providers';
import { DatabaseModule } from 'src/database/database.module';
import { WeixinUtil } from 'src/utils/weixin.util';

@Module({
  providers: [
    RoleService,
    WeixinUtil,
    ...rolesProviders],
  exports: [RoleService],
  imports: [
    DatabaseModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
  ],
})

export class RoleModule { }
