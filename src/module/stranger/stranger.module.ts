import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { StrangerService } from './stranger.service';
import { strangersProviders } from './stranger.providers';
import { DatabaseModule } from 'src/database/database.module';
import { RoleModule } from '../role/role.module';

@Module({
  providers: [StrangerService, ...strangersProviders],
  exports: [StrangerService],
  imports: [
    DatabaseModule,
    RoleModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
  ],
})

export class StrangerModule { }
