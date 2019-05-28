import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { MessageService } from './message.service';
import { messagesProviders } from './message.providers';
import { DatabaseModule } from 'src/database/database.module';

@Module({
  providers: [MessageService, ...messagesProviders],
  exports: [MessageService],
  imports: [
    DatabaseModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
  ],
})

export class MessageModule { }
