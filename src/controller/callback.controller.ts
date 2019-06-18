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
import { CameraUtil } from 'src/utils/camera.util';
import { MediaGateway } from 'src/module/media/media.gateway';

@ApiUseTags('callback')
@ApiBearerAuth()
@ApiForbiddenResponse({ description: 'Unauthorized' })
@Controller('/faceinfo')
export class CallbackController {
  constructor(
    private readonly callbackService: CallbackService,
    private readonly camera: CameraUtil,
    private readonly mediaWS: MediaGateway,
  ) { }

  @ApiOkResponse({
    description: '人脸识别回调',
  })
  @Post('')

  @ApiOperation({ title: '人脸识别回调', description: '人脸识别回调' })
  async faceInfo(@Request() req) {
    // await this.callbackService.callback(req.body)
    // await this.camera.getList()
    await this.mediaWS.sendMessage('5d089fba19fbcb626a93a5f0', { type: '1', imgUrl: '543edbc2-e452-4b96-8e70-1d9dadb17e79.jpg' })
    return { status: 200 }
  }
}