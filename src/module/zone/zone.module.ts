import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { ZoneService } from './zone.service';
import { zonesProviders } from './zone.providers';
import { DatabaseModule } from 'src/database/database.module';
import { RoleModule } from '../role/role.module';

@Module({
  providers: [ZoneService, ...zonesProviders],
  exports: [ZoneService],
  imports: [
    DatabaseModule,
    RoleModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
  ],
})

export class ZoneModule { }
