import { Connection } from 'mongoose';
// 引入schema
import { ZoneSchema } from './schemas/zone.shema';

export const zonesProviders = [
  {
    provide: 'ZoneModelToken',
    useFactory: (connection: Connection) => connection.model('zone', ZoneSchema),
    inject: ['MongoDBConnection'],
  },
];