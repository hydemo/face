import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards, Put, Request } from '@nestjs/common';
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
import { TaskService } from 'src/module/task/task.service';
import { CreateTaskDTO } from 'src/module/task/dto/task.dto';
import { ITask } from 'src/module/task/interfaces/task.interfaces';
import { CreateDeviceDTO } from 'src/module/device/dto/device.dto';


@ApiUseTags('tasks')
@ApiForbiddenResponse({ description: 'Unauthorized' })
@UseGuards(AuthGuard())
@Controller('api/tasks')
export class TaskController {
  constructor(
    private taskService: TaskService,
  ) { }

  @ApiOkResponse({
    description: '任务列表',
    type: CreateTaskDTO,
    isArray: true,
  })
  @Get('/')
  @ApiOperation({ title: '获取任务列表', description: '获取任务列表' })
  taskList(
    @Query() pagination: Pagination,
    @Request() req: any
  ) {
    return this.taskService.findByUser(pagination, req.user._id);
  }

  // @Get('/zones/:zoneId')
  // @ApiOkResponse({
  //   description: '根据区域查询任务列表',
  // })
  // @ApiCreatedResponse({ description: '获取任务' })
  // @ApiOperation({ title: '根据区域查询任务列表', description: '根据区域查询任务列表' })
  // async findByZoneId(@Param('id', new MongodIdPipe()) zoneId: string) {
  //   const data: ITask[] = await this.taskService.findByZoneId(zoneId);
  //   return { statusCode: 200, msg: '获取任务成功', data };
  // }

  // @Get('/:id')
  // @ApiOkResponse({
  //   description: '获取任务成功',
  // })
  // @ApiCreatedResponse({ description: '获取任务' })
  // @ApiOperation({ title: '根据id获取任务信息', description: '根据id获取任务信息' })
  // async findById(@Param('id', new MongodIdPipe()) id: string) {
  //   const data: ITask = await this.taskService.findById(id);
  //   return { statusCode: 200, msg: '获取任务成功', data };
  // }


  @Put('/:id/done')
  @ApiOkResponse({
    description: '完成任务',
  })
  @ApiOperation({ title: '完成任务', description: '完成任务' })
  async completeTask(
    @Param('id', new MongodIdPipe()) id: string,
    @Body() device: CreateDeviceDTO
  ) {
    await this.taskService.doTask(id, device);
    return { statusCode: 200, msg: '完成任务成功' };
  }

}