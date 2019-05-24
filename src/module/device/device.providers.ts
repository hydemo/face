import { Connection } from 'mongoose';
// 引入schema
import { DeviceSchema } from './schemas/device.schema';

export const devicesProviders = [
  {
    provide: 'DeviceModelToken',
    useFactory: (connection: Connection) => connection.model('device', DeviceSchema),
    inject: ['MongoDBConnection'],
  },
];