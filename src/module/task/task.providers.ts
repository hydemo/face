import { Connection } from 'mongoose';
// 引入schema
import { TaskSchema } from './schemas/task.shema';

export const tasksProviders = [
  {
    provide: 'TaskModelToken',
    useFactory: (connection: Connection) => connection.model('task', TaskSchema),
    inject: ['MongoDBConnection'],
  },
];