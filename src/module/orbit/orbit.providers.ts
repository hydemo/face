import { Connection } from 'mongoose';
// 引入schema
import { OrbitSchema } from './schemas/orbit.shema';

export const orbitsProviders = [
  {
    provide: 'OrbitModelToken',
    useFactory: (connection: Connection) => connection.model('orbit', OrbitSchema),
    inject: ['MongoDBConnection'],
  },
];