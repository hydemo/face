import { Connection } from 'mongoose';
// 引入schema
import { MessageSchema } from './schemas/message.shema';

export const messagesProviders = [
  {
    provide: 'MessageModelToken',
    useFactory: (connection: Connection) => connection.model('message', MessageSchema),
    inject: ['MongoDBConnection'],
  },
];