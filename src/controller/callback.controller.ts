import {
  Controller,
  Request,
  Post,
  Get,
  Query,
  Response,
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
import { RoleService } from 'src/module/role/role.service';
import { FaceService } from 'src/module/face/face.service';
import { CreatePoliceRole } from 'src/module/role/dto/role.dto';
import { UserService } from 'src/module/users/user.service';


@ApiUseTags('callback')
@ApiBearerAuth()
@ApiForbiddenResponse({ description: 'Unauthorized' })
@Controller('/')
export class CallbackController {
  constructor(
    private readonly callbackService: CallbackService,
    private readonly camera: CameraUtil,
    // private readonly mediaWS: MediaGateway,
    private readonly socUtil: SOCUtil,
    // private readonly phoneUtil: PhoneUtil,
    // private readonly zocUtil: ZOCUtil,
    // private readonly preownerService: PreownerService,
    // private readonly zoneService: ZoneService,
    // private readonly config: ConfigService,
    private readonly redis: RedisService,
    // private readonly p2pErrorService: P2PErrorService,
    private readonly residentService: ResidentService,
    private readonly roleService: RoleService,
    private readonly faceService: FaceService,
    private readonly userService: UserService,
    private readonly zoneService: ZoneService,
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
    description: '设备注册',
  })
  @Post('/register')

  @ApiOperation({ title: '设备注册', description: '设备注册' })
  async register(
    @Request() req,
    @Response() res
  ) {
    const result = await this.callbackService.register(req.body)
    res.setHeader("Content-Type", "text/json;charset=UTF-8")
    res.end(JSON.stringify(result))
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
    // const ips = await client.hkeys('Log_op')
    // await client.hset('Log', 'resident', 0)
    // const ss = await client.hget('Log', 'resident')
    // if (!ss) {
    //   console.log(111)
    // }
    // console.log(typeof (ss), 'as')
    // await client.del('p2p_listen')
    // // await client.lpush('p2pErrorFinal', '2')
    // await client.del('p2pErrorFinal')
    // await client.lpush('p2p', '22')
    // await client.lpush('p2p', '33')
    // await client.rpush('p2p', '44')
    // console.log(await client.rpop('p2p'))
    // co

    return
  }

  @ApiOkResponse({
    description: '心跳数据',
  })
  @Post('/tests')

  @ApiOperation({ title: '心跳数据', description: '心跳数据' })
  async test(
    @Request() req,
    @Query('code') code: string,
    @Query('code1') code1: string,
  ) {

    // await this.callbackService.upResidentToSOC(code)
    // await this.callbackService.upDeviceToZOC(code)
    await this.socUtil.check(code)
    // await this.faceService.check()
    // await this.socUtil.upload('')
    // const createRole: CreatePoliceRole = {
    //   user: '5d38515b4bda2f535ddea0ed',
    //   role: 4,
    //   checkResult: 2,
    //   reviewer: '5d38515b4bda2f535ddea0ed',
    //   area: '5d4bbcdf40fdb006f1c8be03'
    // }
    // await this.roleService.createPoliceByCMS(createRole)
    // await this.callbackService.upDeviceToZOC(code)
    // await this.callbackService.upResidentToZOC(code)
    // await this.camera.getPersionInfo('22', 1, 2)
    // await this.faceService.fix()
    // await this.residentService.fix()
    // const user = await this.userService.findById(code)
    // if (!user) {
    //   return
    // }
    // const img = await this.camera.getImg(`${user.faceUrl}`);
    // const data = await this.camera.addToDevice(code1, user, img)
    // const data = await this.camera.getPersionInfo(code, code1, 2)
    // const data = await this.socUtil.qrcodeAddress(code)

    // console.log(data, 'data')
    // await this.roleService.fix()
    // const user = { _id: 1, username: '11' }
    // const img = await this.camera.getImg('user/e604b4db-54ce-4971-8db9-ca8a56554a61.jpg')
    // await this.camera.addToDevice(user, img)
    // const data = await this.socUtil.qrcodeAddress(code, '2')
    // console.log(data)
    // await this.zoneService.fix(code, code1)
    return

  }

}