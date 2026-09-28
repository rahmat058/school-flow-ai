import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ResponseMessage } from '../common/decorators/response-message.decorator.js';
import { Resource } from '../common/decorators/resource.decorator.js';
import { ListSchoolsDto } from './dto/list-schools.dto.js';
import { SchoolService } from './school.service.js';

@Resource('schools')
@Controller('schools')
export class SchoolController {
  constructor(private readonly schoolService: SchoolService) {}

  @Get()
  @ResponseMessage('Schools retrieved')
  list(@Query() query: ListSchoolsDto) {
    return this.schoolService.list(query);
  }

  @Get(':id')
  @ResponseMessage('School retrieved')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.schoolService.findOne(id);
  }
}
