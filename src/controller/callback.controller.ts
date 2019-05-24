import {
  Controller,
  Request,
  Post,
} from '@nestjs/common';
import {
  ApiUseTags,
  ApiBearerAuth,
  ApiOkResponse,
  ApiForbiddenResponse,
  ApiOperation,
} from '@nestjs/swagger';
import { CallbackService } from 'src/module/callback/callback.service';
import { QiniuUtil } from 'src/utils/qiniu.util';
import { CameraUtil } from 'src/utils/camera.util';

@ApiUseTags('callback')
@ApiBearerAuth()
@ApiForbiddenResponse({ description: 'Unauthorized' })
@Controller('/faceinfo')
export class CallbackController {
  constructor(
    private readonly callbackService: CallbackService,
    private readonly qiniuUtil: QiniuUtil,
    private readonly cameraUtil: CameraUtil,
  ) { }

  @ApiOkResponse({
    description: '人脸识别回调',
  })
  @Post('')

  @ApiOperation({ title: '人脸识别回调', description: '人脸识别回调' })
  async faceInfo(@Request() req) {
    await this.callbackService.callback(req.body)
    return { status: 200 }
  }
}