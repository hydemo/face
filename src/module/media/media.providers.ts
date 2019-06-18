import { Connection } from 'mongoose';
// 引入schema
import { MediaSchema } from './schemas/media.shema';

export const mediasProviders = [
  {
    provide: 'MediaModelToken',
    useFactory: (connection: Connection) => connection.model('media', MediaSchema),
    inject: ['MongoDBConnection'],
  },

];