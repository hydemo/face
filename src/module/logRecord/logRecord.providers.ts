import { Connection } from 'mongoose';
// 引入schema
import { LogRecordSchema } from './schemas/logRecord.shema';

export const logRecordProviders = [
  {
    provide: 'LogRecordModelToken',
    useFactory: (connection: Connection) => connection.model('logRecord', LogRecordSchema),
    inject: ['MongoDBConnection'],
  },
];