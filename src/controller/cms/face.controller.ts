import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
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
import { FaceService } from 'src/module/face/face.service';
import { CreateFaceDTO } from 'src/module/face/dto/face.dto';
import { IFace } from 'src/module/face/interfaces/face.interfaces';


@ApiUseTags('faces')
@ApiForbiddenResponse({ description: 'Unauthorized' })
@UseGuards(AuthGuard(), RolesGuard)
@Controller('cms/faces')
export class CMSFaceController {
  constructor(
    private faceService: FaceService,
  ) { }

  @ApiOkResponse({
    description: '名单列表',
    type: CreateFaceDTO,
    isArray: true,
  })
  @Get('/')
  @ApiOperation({ title: '获取名单列表', description: '获取名单列表' })
  faceList(@Query() pagination: Pagination) {
    return this.faceService.findAll(pagination);
  }

  // @Get('/:id')
  // @ApiOkResponse({
  //   description: '获取名单成功',
  // })
  // @ApiCreatedResponse({ description: '获取名单' })
  // @ApiOperation({ title: '根据id获取名单信息', description: '根据id获取名单信息' })
  // async findById(@Param('id', new MongodIdPipe()) id: string) {
  //   const data: IFace = await this.faceService.findById(id);
  //   return { statusCode: 200, msg: '获取名单成功', data };
  // }

  @Post('')
  @ApiOkResponse({
    description: '添加名单成功',
  })
  @ApiOperation({ title: '添加名单', description: '添加名单' })
  async create(@Body() creatFaceDTO: CreateFaceDTO) {
    await this.faceService.create(creatFaceDTO);
    return { statusCode: 200, msg: '添加名单成功' };
  }

  // @Delete('/:id')
  // @ApiOkResponse({
  //   description: '删除名单成功',
  // })
  // @ApiOperation({ title: '删除名单', description: '删除名单' })
  // async delete(@Param('id', new MongodIdPipe()) id: string) {
  //   await this.faceService.deleteById(id);
  //   return { statusCode: 200, msg: '删除名单成功' };
  // }


}