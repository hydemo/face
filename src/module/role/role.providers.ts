import { Connection } from 'mongoose';
// 引入schema
import { RoleSchema } from './schemas/role.shema';

export const rolesProviders = [
  {
    provide: 'RoleModelToken',
    useFactory: (connection: Connection) => connection.model('role', RoleSchema),
    inject: ['MongoDBConnection'],
  },
];