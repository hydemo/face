import { Connection } from 'mongoose';
// 引入schema
import { AreaSchema } from './schemas/area.shema';

export const areasProviders = [
  {
    provide: 'AreaModelToken',
    useFactory: (connection: Connection) => connection.model('area', AreaSchema),
    inject: ['MongoDBConnection'],
  },
];