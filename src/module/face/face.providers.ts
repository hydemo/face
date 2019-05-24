import { Connection } from 'mongoose';
// 引入schema
import { FaceSchema } from './schemas/face.shema';

export const facesProviders = [
  {
    provide: 'FaceModelToken',
    useFactory: (connection: Connection) => connection.model('face', FaceSchema),
    inject: ['MongoDBConnection'],
  },
];