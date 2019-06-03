import { Connection } from 'mongoose';
// 引入schema
import { RentSchema } from './schemas/rent.shema';

export const rentsProviders = [
  {
    provide: 'RentModelToken',
    useFactory: (connection: Connection) => connection.model('rent', RentSchema),
    inject: ['MongoDBConnection'],
  },
];