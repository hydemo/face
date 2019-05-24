import { Connection } from 'mongoose';
// 引入schema
import { StrangerSchema } from './schemas/stranger.shema';

export const strangersProviders = [
  {
    provide: 'StrangerModelToken',
    useFactory: (connection: Connection) => connection.model('stranger', StrangerSchema),
    inject: ['MongoDBConnection'],
  },
];