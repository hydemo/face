import { Connection } from 'mongoose';
// 引入schema
import { PreownerSchema } from './schemas/preowner.shema';

export const PreownersProviders = [
  {
    provide: 'PreownerModelToken',
    useFactory: (connection: Connection) => connection.model('preowner', PreownerSchema),
    inject: ['MongoDBConnection'],
  },
];