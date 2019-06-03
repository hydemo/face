import { Connection } from 'mongoose';
// 引入schema
import { BlackSchema } from './schemas/black.shema';

export const blacksProviders = [
  {
    provide: 'BlackModelToken',
    useFactory: (connection: Connection) => connection.model('black', BlackSchema),
    inject: ['MongoDBConnection'],
  },
];