import { Connection } from 'mongoose';
// 引入schema
import { ResidentSchema } from './schemas/resident.shema';

export const residentsProviders = [
  {
    provide: 'ResidentModelToken',
    useFactory: (connection: Connection) => connection.model('resident', ResidentSchema),
    inject: ['MongoDBConnection'],
  },
];