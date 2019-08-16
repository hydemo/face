import { Connection } from 'mongoose';
// 引入schema
import { SchoolSchema } from './schemas/school.shema';

export const schoolsProviders = [
  {
    provide: 'SchoolModelToken',
    useFactory: (connection: Connection) => connection.model('school', SchoolSchema),
    inject: ['MongoDBConnection'],
  },
];