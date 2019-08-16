import { Connection } from 'mongoose';
// 引入schema
import { ContactSchema } from './schemas/contact.shema';

export const contactsProviders = [
  {
    provide: 'ContactModelToken',
    useFactory: (connection: Connection) => connection.model('contact', ContactSchema),
    inject: ['MongoDBConnection'],
  },
];