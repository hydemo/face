'use strict';

import * as mongoose from 'mongoose';
import { ConfigService } from '@config/config.service';


export const databaseProviders = [
  {
    inject: [ConfigService],
    provide: 'MongoDBConnection',
    useFactory: async (config: ConfigService): Promise<typeof mongoose> =>
      await mongoose.connect(`mongodb://${config.databaseUser}:${config.databasePwd}@${config.databaseHost}:${config.databasePort}/${config.databaseName}`,
        { useNewUrlParser: true, autoIndex: false }),
  }
];