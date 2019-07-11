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
import { PreownerService } from 'src/module/preowner/preowner.service';
import { ZoneService } from 'src/module/zone/zone.service';
import { IDetail } from 'src/module/zone/interfaces/detail.interface';
import { IZone } from 'src/module/zone/interfaces/zone.interfaces';
import { ConfigService } from 'src/config/config.service';
import { IPropertyCo } from 'src/module/zone/interfaces/propertyCo.interface';

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
  ) { }

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
  @Post('/test')

  @ApiOperation({ title: '心跳数据', description: '心跳数据' })
  async test(@Request() req) {
    const time = moment().format('YYYYMMDDHHmmss');
    const preowners = await this.preownerService.findAll()
    const zone: IZone | null = await this.zoneService.findOneByCondition({ zoneLayer: 0 })
    if (!zone) return
    const detail: IDetail = zone.detail
    const propertyCo: IPropertyCo = zone.propertyCo
    const residents: any = []
    await Promise.all(preowners.map(async preowner => {
      const houseNumber = `罗马家园-${preowner.building}-${preowner.houseNumber}`
      const address: IZone | null = await this.zoneService.findOneByCondition({ houseNumber })
      if (!address) return
      const order = await this.zocUtil.getOrder()
      const data = {
        SBXXLSH: order,
        SYSTEMID: address.profile.dzbm,
        DSBM: detail.DSBM,
        DZMC: address.profile.dzqc,
        QU_ID: detail.QU_ID,
        QU: detail.QU,
        DMDM: detail.DMDM,
        DMMC: detail.DMMC,
        XZJDDM: detail.XZJDDM,
        XZJDMC: detail.XZJDMC,
        SQJCWHDM: detail.SQJCWHDM,
        SQJCWHMC: detail.SQJCWHMC,
        DZYSLX: address.profile.dzsx,
        MAPX: address.profile.lng,
        MAPY: address.profile.lat,
        GAJGJGDM: detail.GAJGJGDM,
        GAJGNBDM: detail.GAJGJGDM,
        GAJGJGMC: detail.GAJGJGMC,
        JWWGDM: detail.JWWGDM,
        JWWGMC: detail.JWWGMC,
        ZHXM: preowner.username,
        ZHSJHM: preowner.phone,
        ZHSFZ: preowner.cardNumber,
        ZHLX: '03',
        CJSJ: this.zocUtil.getTemp(),
        DJSJ: moment().format('YYYYMMDDHHmmss'),
        XTLY: this.config.companyAppName,
        SJCS: this.config.companyCreditCode,
        GLMJSB: ['180000001'],
        ZHXB: '',
        ZHMZ: '',
        ZHJG: '',
        ZHSFZDZ: '',
        ICMJKKH: '',
        ICMJKZT: '',
        ICMJKLX: '',
        ZHZT: '',
        MJZH: '',
        MJMM: '',
      }
      residents.push(data)
    }))
    const zip = await this.zocUtil.genZip()
    await this.zocUtil.genResident(zip, time, residents)
    await this.zocUtil.genBasicAddr(zip, time, detail)
    await this.zocUtil.genManufacturer(zip, time)
    await this.zocUtil.genPropertyCo(zip, time, propertyCo, detail)
    await this.zocUtil.genDevice(zip, time, detail)
    await this.zocUtil.upload(zip, time)
  }

}