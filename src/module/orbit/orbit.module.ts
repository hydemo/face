import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { OrbitService } from './orbit.service';
import { orbitsProviders } from './orbit.providers';
import { DatabaseModule } from 'src/database/database.module';

@Module({
  providers: [OrbitService, ...orbitsProviders],
  exports: [OrbitService],
  imports: [
    DatabaseModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
  ],
})

export class OrbitModule { }
