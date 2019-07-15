import { Module, Global } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { P2PErrorService } from './p2pError.service';
import { p2pErrorsProviders } from './p2pError.providers';
import { DatabaseModule } from 'src/database/database.module';

@Global()
@Module({
  providers: [P2PErrorService, ...p2pErrorsProviders],
  exports: [P2PErrorService],
  imports: [
    DatabaseModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
  ],
})

export class P2PErrorModule { }
