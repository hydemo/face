import {
  Controller,
  Request,
  Post,
  Get,
  Query,
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
import { RedisService } from 'nestjs-redis';
import { PreownerService } from 'src/module/preowner/preowner.service';
import { ZoneService } from 'src/module/zone/zone.service';
import { IDetail } from 'src/module/zone/interfaces/detail.interface';
import { IZone } from 'src/module/zone/interfaces/zone.interfaces';
import { ConfigService } from 'src/config/config.service';
import { IPropertyCo } from 'src/module/zone/interfaces/propertyCo.interface';
import { ResidentService } from 'src/module/resident/resident.service';
import { P2PErrorService } from 'src/module/p2pError/p2pError.service';
import { IDevice } from 'src/module/device/interfaces/device.interfaces';


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
    private readonly preownerService: PreownerService,
    private readonly zoneService: ZoneService,
    private readonly config: ConfigService,
    private readonly redis: RedisService,
    private readonly p2pErrorService: P2PErrorService,
    private readonly residentService: ResidentService,
  ) {

  }

  @ApiOkResponse({
    description: '人脸识别回调',
  })
  @Post('/faceinfo')

  @ApiOperation({ title: '人脸识别回调', description: '人脸识别回调' })
  async faceInfo(@Request() req) {
    // // return await this.zocUtil.test()
    // const time = moment().format('YYYYMMDDHHmmss');
    // const address = await this.socUtil.address('4DE6E021-F538-1A9C-E054-90E2BA510A0C');
    // const zone = await this.socUtil.address('1A814683-14F8-6129-E054-90E2BA548A34');
    // const deviceZone = await this.socUtil.address('50C92F98-CCE5-37D6-E054-90E2BA548A34');
    // console.log(zone, 'zone')
    // const zip = await this.zocUtil.genZip()
    // // await this.zocUtil.genResident(zip, time, address);
    // // await this.zocUtil.genBasicAddr(zip, time, deviceZone);
    // await this.zocUtil.genDevice(zip, time, zone);
    // // await this.zocUtil.genEnRecord(zip, time, deviceZone);
    // // await this.zocUtil.genManufacturer(zip, time);
    // // await this.zocUtil.genPropertyCo(zip, time, zone)
    // // await this.zocUtil.genImage(zip, time, zone, '7443634e-c73e-417d-940f-341648e994e2.jpg')
    // // await this.zocUtil.upload(zip, time)
    // // // await this.zocUtil.
    await this.callbackService.callback(req.body)
    // await this.camera.getList()
    // await this.mediaWS.sendMessage('5d089fba19fbcb626a93a5f0', { type: '1', imgUrl: '543edbc2-e452-4b96-8e70-1d9dadb17e79.jpg' })
    return { status: 200 }
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

  @ApiOkResponse({
    description: '心跳数据',
  })
  @Post('/send')

  @ApiOperation({ title: '心跳数据', description: '心跳数据' })
  async send(@Request() req) {
    const client = this.redis.getClient()
    const pools = await client.hkeys('p2p_pool')
    const errorPools = await client.hkeys('p2pError_pool')
    const p2pPools: any = []
    const p2pErrorPools: any = []
    await Promise.all(pools.map(async pool => {
      const count = await client.llen(`p2p_${pool}`)
      p2pPools.push({ pool, count })
    }))
    await Promise.all(errorPools.map(async pool => {
      const count = await client.llen(`p2pError_${pool}`)
      p2pErrorPools.push({ pool, count })
    }))
    const finalCount = await client.llen('p2pErrorFinal')
    const final = await client.lrange('p2pErrorFinal', 0, finalCount)
    return { p2pPools, p2pErrorPools, finalCount, final }

  }

  @ApiOkResponse({
    description: '心跳数据',
  })

  @Post('/handle')

  @ApiOperation({ title: '心跳数据', description: '心跳数据' })
  async handle(@Request() req) {
    const client = this.redis.getClient()
    await client.del('p2p_listen')
    await client.lpush('p2pErrorFinal', '2')
    await client.del('p2pError_5d32f812c03242510ce4030b')
    // await client.lpush('p2p', '22')
    // await client.lpush('p2p', '33')
    // await client.rpush('p2p', '44')
    // console.log(await client.rpop('p2p'))
    return
  }

  @ApiOkResponse({
    description: '心跳数据',
  })
  @Post('/test')

  @ApiOperation({ title: '心跳数据', description: '心跳数据' })
  async test(
    @Request() req,
    @Query('code') code: string,
  ) {
    // await this.callbackService.upDeviceToZOC(code)
    // await this.callbackService.upResidentToZOC(code)
    const residents = await this.residentService.fix()
    return

  }

}