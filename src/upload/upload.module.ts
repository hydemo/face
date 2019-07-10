import { Module, MulterModule } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { join } from 'path';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { UploadController } from './upload.controller';
import { ConfigModule } from 'src/config/config.module';
import { QiniuUtil } from 'src/utils/qiniu.util';
import { PreownerModule } from 'src/module/preowner/preowner.module';


@Module({
  providers: [
    QiniuUtil,
  ],
  controllers: [UploadController],
  imports: [
    ConfigModule,
    PreownerModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    MulterModule.registerAsync({
      useFactory: () => {
        const uploadPath = join(__dirname, '../..', 'upload/excel');
        const storage = diskStorage({
          destination: uploadPath
          , filename: (req, file, cb) => {
            const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
            cb(null, `${randomName}${extname(file.originalname)}`);
          },
        });
        return { storage };
      },
    }),
  ],
})

export class UploadModule { }
