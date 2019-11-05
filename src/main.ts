import { AppModule } from './app.module';
import { NestFactory } from '@nestjs/core';
import * as helmet from 'helmet';
import * as compression from 'compression';
import * as rateLimit from 'express-rate-limit';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { join } from 'path';
import { ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from './common/filter/http-exception.filter';
import { LoggingInterceptor } from './common/interceptor/logging.interceptor';
import { ConfigService } from './config/config.service';

import { InitService } from './init/init.service';
import { ScheduleService } from './schedule/schedule.service';
import { UploadModule } from './upload/upload.module';
import { RedisService } from 'nestjs-redis';

const bodyParser = require('body-parser');
// require('body-parser-xml')(bodyParser);

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config: ConfigService = app.get(ConfigService);
  const redis: RedisService = app.get(RedisService)

  app.use(helmet())
    .use(compression())
    .use(bodyParser.json({ limit: '20mb' }))
    .use(
      bodyParser.urlencoded({
        extended: true
      })
    ).use(rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 10000 // limit each IP to 100 requests per windowMs
    }));

  const initService: InitService = app.get(InitService);
  const scheduleService: ScheduleService = app.get(ScheduleService);

  // app.use(bodyParser.xml({
  //   limit: '2MB',   // Reject payload bigger than 1 MB
  //   xmlParseOptions: {
  //     normalize: true,     // Trim whitespace inside text nodes
  //     normalizeTags: true, // Transform tags to lowercase
  //     explicitArray: false // Only put nodes in array if >1
  //   }
  // }));
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true, skipMissingProperties: true }));
  app.enableCors();
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new LoggingInterceptor(redis));
  const uploadedPath = join(__dirname, '../', 'upload');
  app.useStaticAssets(uploadedPath);
  const ApiOptions = new DocumentBuilder()
    .setTitle('小门神API文档')
    .setDescription('小门神API文档')
    .setVersion('1.0')
    .addBearerAuth()
    .setSchemes('http', 'https')
    .build();

  initService.init();
  scheduleService.enableSchedule()

  const ApiDocument = SwaggerModule.createDocument(app, ApiOptions, {
    include: [
      AppModule,
      UploadModule,
    ],
  });
  SwaggerModule.setup('swagger', app, ApiDocument);
  await app.listen(config.port);

}
bootstrap();