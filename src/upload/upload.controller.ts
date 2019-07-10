import {
  Controller,
  Post,
  Request,
  UseGuards,
  UseInterceptors,
  FileInterceptor,
  UploadedFile,
  Get,
  Inject,
  Param,
} from '@nestjs/common';

import {
  ApiUseTags,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiConsumes,
  ApiImplicitFile,
  ApiOperation,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from 'src/config/config.service';
import * as qiniu from 'qiniu';
import { QiniuUtil } from 'src/utils/qiniu.util';
import { MongodIdPipe } from 'src/common/pipe/mongodId.pipe';
import { PreownerService } from 'src/module/preowner/preowner.service';



@ApiUseTags('upload')
@ApiBearerAuth()
@ApiForbiddenResponse({ description: 'Unauthorized' })
@Controller('upload')
export class UploadController {
  constructor(
    @Inject(ConfigService) private readonly configService: ConfigService,
    @Inject(QiniuUtil) private readonly qiniuUtil: QiniuUtil,
    @Inject(PreownerService) private readonly preownerService: PreownerService,

  ) { }
  @Post('local')
  @ApiConsumes('multipart/form-data')
  @ApiImplicitFile({ name: 'file', required: true, description: '修改头像' })
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(@Request() req, @UploadedFile() file) {
    return { statusCode: 200, msg: '上传成功 ', data: file.filename };
  }

  @Post('zone/:id/owner')
  @ApiConsumes('multipart/form-data')
  @ApiImplicitFile({ name: 'file', required: true, description: '修改头像' })
  @UseInterceptors(FileInterceptor('file'))
  async uploadOwner(
    @Request() req, @UploadedFile() file: any,
    @Param('id', new MongodIdPipe()) id: string,
  ) {
    await this.preownerService.upload(id, file.filename)
    return { statusCode: 200, msg: '上传成功 ' };
  }

  @Get('qiniu/token')
  // @UseGuards(AuthGuard())
  @ApiOperation({ title: '获取七牛云token', description: '获取七牛云token' })
  async uploadToken() {
    const uploadToken = await this.qiniuUtil.getUpToken()
    return { statusCode: 200, uploadToken }
  }
}