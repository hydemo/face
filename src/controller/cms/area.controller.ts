import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
  Inject,
  Request
} from "@nestjs/common";

import { Pagination } from "../../common/dto/pagination.dto";
import {
  ApiUseTags,
  ApiOkResponse,
  ApiForbiddenResponse,
  ApiOperation,
  ApiBearerAuth
} from "@nestjs/swagger";
import { AuthGuard } from "@nestjs/passport";
import { AreaService } from "src/module/area/area.service";
import { CreateAreaDTO } from "src/module/area/dto/area.dto";

@ApiUseTags("cms/area")
@ApiBearerAuth()
@ApiForbiddenResponse({ description: "Unauthorized" })
// @UseGuards(AuthGuard())
@Controller("cms/area")
export class CMSAreaController {
  constructor(@Inject(AreaService) private areaService: AreaService) {}

  @ApiOkResponse({
    description: "片区列表",
    isArray: true
  })
  @Get("/")
  @ApiOperation({ title: "获取片区列表", description: "获取片区列表" })
  myAreas(@Query() pagination: Pagination) {
    return this.areaService.list(pagination);
  }

  @ApiOkResponse({
    description: "新增片区"
  })
  @Post("/")
  @ApiOperation({ title: "新增片区", description: "新增片区" })
  async createArea(@Body() area: CreateAreaDTO) {
    await this.areaService.create(area);
    return { statusCode: 200, msg: "新增成功" };
  }
}
