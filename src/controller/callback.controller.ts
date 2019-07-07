import {
  Controller,
  Request,
  Post,
  Get,
} from '@nestjs/common';
import {
  ApiUseTags,
  ApiBearerAuth,
  ApiOkResponse,
  ApiForbiddenResponse,
  ApiOperation,
} from '@nestjs/swagger';
import * as moment from 'moment'
import { CallbackService } from 'src/module/callback/callback.service';
import { CameraUtil } from 'src/utils/camera.util';
import { MediaGateway } from 'src/module/media/media.gateway';
import { SOCUtil } from 'src/utils/soc.util';
import { PhoneUtil } from 'src/utils/phone.util';
import { ZOCUtil } from 'src/utils/zoc.util';

@ApiUseTags('callback')
@ApiBearerAuth()
@ApiForbiddenResponse({ description: 'Unauthorized' })
@Controller('/')
export class CallbackController {
  constructor(
    private readonly callbackService: CallbackService,
    private readonly camera: CameraUtil,
    private readonly mediaWS: MediaGateway,
    private readonly socUtil: SOCUtil,
    private readonly phoneUtil: PhoneUtil,
    private readonly zocUtil: ZOCUtil,
  ) { }

  @ApiOkResponse({
    description: '人脸识别回调',
  })
  @Post('/faceinfo')

  @ApiOperation({ title: '人脸识别回调', description: '人脸识别回调' })
  async faceInfo(@Request() req) {
    const time = moment().format('YYYYMMDDHHmmss');
    const address = await this.socUtil.address('4DE6E021-F538-1A9C-E054-90E2BA510A0C');
    const zone = await this.socUtil.address('1A814683-14F8-6129-E054-90E2BA548A34');
    const deviceZone = await this.socUtil.address('50C92F98-CCE5-37D6-E054-90E2BA548A34');
    // await this.zocUtil.genResident(time, address);
    // await this.zocUtil.genBasicAddr(time, deviceZone);
    // await this.zocUtil.genDevice(time, zone);
    // await this.zocUtil.genEnRecord(time, deviceZone);
    // await this.zocUtil.genManufacturer(time);
    // await this.zocUtil.genPropertyCo(time, zone)
    // await this.zocUtil.genImage(time, zone)
    // await this.zocUtil.upload(time)
    // await this.zocUtil.
    // await this.callbackService.callback(req.body)
    // await this.camera.getList()
    // await this.mediaWS.sendMessage('5d089fba19fbcb626a93a5f0', { type: '1', imgUrl: '543edbc2-e452-4b96-8e70-1d9dadb17e79.jpg' })
    return { status: 200, address, zone, deviceZone }
  }


  @ApiOkResponse({
    description: '心跳数据',
  })
  @Post('/keepalive')

  @ApiOperation({ title: '心跳数据', description: '心跳数据' })
  async keeplive(@Request() req) {
    await this.callbackService.keepalive(req.body)
    return { status: 200 }
  }

}