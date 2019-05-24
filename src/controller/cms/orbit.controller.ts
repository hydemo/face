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
import { OrbitService } from 'src/module/orbit/orbit.service';
import { CreateOrbitDTO } from 'src/module/orbit/dto/orbit.dto';


@ApiUseTags('orbits')
@ApiForbiddenResponse({ description: 'Unauthorized' })
// @UseGuards(AuthGuard(), RolesGuard)
@Controller('cms/orbits')
export class CMSOrbitController {
  constructor(
    private orbitService: OrbitService,
  ) { }

  @ApiOkResponse({
    description: '通行记录列表',
    type: CreateOrbitDTO,
    isArray: true,
  })
  @Get('/')
  @ApiOperation({ title: '获取通行记录列表', description: '获取通行记录列表' })
  orbitList(@Query() pagination: Pagination) {
    return this.orbitService.findAll(pagination);
  }

  // @Get('/:id')
  // @ApiOkResponse({
  //   description: '获取通行记录成功',
  // })
  // @ApiCreatedResponse({ description: '获取通行记录' })
  // @ApiOperation({ title: '根据id获取通行记录信息', description: '根据id获取通行记录信息' })
  // async findById(@Param('id', new MongodIdPipe()) id: string) {
  //   const data: IOrbit = await this.orbitService.findById(id);
  //   return { statusCode: 200, msg: '获取通行记录成功', data };
  // }

  @Post('')
  @ApiOkResponse({
    description: '添加通行记录成功',
  })
  @ApiOperation({ title: '添加通行记录', description: '添加通行记录' })
  async create(@Body() creatOrbitDTO: CreateOrbitDTO) {
    await this.orbitService.create(creatOrbitDTO);
    return { statusCode: 200, msg: '添加通行记录成功' };
  }

  // @Delete('/:id')
  // @ApiOkResponse({
  //   description: '删除通行记录成功',
  // })
  // @ApiOperation({ title: '删除通行记录', description: '删除通行记录' })
  // async delete(@Param('id', new MongodIdPipe()) id: string) {
  //   await this.orbitService.deleteById(id);
  //   return { statusCode: 200, msg: '删除通行记录成功' };
  // }


}