import { Connection } from 'mongoose';
// 引入schema
import { P2PErrorSchema } from './schemas/p2pError.shema';

export const p2pErrorsProviders = [
  {
    provide: 'P2PErrorModelToken',
    useFactory: (connection: Connection) => connection.model('p2pError', P2PErrorSchema),
    inject: ['MongoDBConnection'],
  },
];