import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards, Inject, Request } from '@nestjs/common';
import {
  ApiUseTags,
  ApiOkResponse,
  ApiForbiddenResponse,
  ApiCreatedResponse,
  ApiOperation,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/common/guard/roles.guard';
import { Pagination } from 'src/common/dto/pagination.dto';
import { MongodIdPipe } from 'src/common/pipe/mongodId.pipe';
import { ResidentService } from 'src/module/resident/resident.service';
import { CreateResidentDTO, ResidentDTO } from 'src/module/resident/dto/resident.dto';
import { IResident } from 'src/module/resident/interfaces/resident.interfaces';


@ApiUseTags('residents')
@UseGuards(AuthGuard())
@ApiForbiddenResponse({ description: 'Unauthorized' })
@Controller('api/residents')
export class ResidentController {
  constructor(
    @Inject(ResidentService) private residentService: ResidentService,
  ) { }

  // @ApiOkResponse({
  //   description: '常住人列表',
  //   type: CreateResidentDTO,
  //   isArray: true,
  // })
  // @Get('/')
  // @ApiOperation({ title: '获取常住人列表', description: '获取常住人列表' })
  // residentList(@Query() pagination: Pagination) {
  //   return this.residentService.findAll(pagination);
  // }

  @Post('/owner')
  @ApiOkResponse({
    description: '申请业主',
  })
  @ApiOperation({ title: '申请业主', description: '申请业主' })
  async ownerApplication(
    @Body() resident: CreateResidentDTO,
    @Request() req: any
  ) {
    await this.residentService.ownerApplication(resident, req.user);
    return { statusCode: 200, msg: '申请成功' };
  }

  @Post('/family')
  @ApiOkResponse({
    description: '申请常住人',
  })
  @ApiOperation({ title: '申请常住人', description: '申请常住人' })
  async familyApplication(
    @Body() resident: CreateResidentDTO,
    @Request() req: any
  ) {
    await this.residentService.familyApplication(resident, req.user);
    return { statusCode: 200, msg: '申请成功' };
  }
}