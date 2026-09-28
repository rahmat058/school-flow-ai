import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { Role } from '../common/enums/role.enum.js';
import {
  CurrentUser,
  type AuthenticatedUser,
} from '../common/decorators/current-user.decorator.js';
import { Public } from '../common/decorators/public.decorator.js';
import { Resource } from '../common/decorators/resource.decorator.js';
import { ResponseMessage } from '../common/decorators/response-message.decorator.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { RegisterSchoolDto } from '../registration/dto/register-school.dto.js';
import { RegistrationService } from '../registration/registration.service.js';
import { ListSchoolsDto } from './dto/list-schools.dto.js';
import { PatchSchoolSettingsDto } from './dto/patch-school-settings.dto.js';
import { UpdateSchoolProfileDto } from './dto/update-school-profile.dto.js';
import { SchoolService } from './school.service.js';

@Resource('schools')
@Controller('schools')
export class SchoolController {
  constructor(
    private readonly schoolService: SchoolService,
    private readonly registrationService: RegistrationService,
  ) {}

  @Public()
  @Post('register')
  @ResponseMessage(
    'School registered — check your email to verify the admin account',
  )
  register(@Body() dto: RegisterSchoolDto) {
    return this.registrationService.register(dto);
  }

  @Get()
  @Roles(Role.ADMIN)
  @ResponseMessage('Schools retrieved')
  list(@Query() query: ListSchoolsDto) {
    return this.schoolService.list(query);
  }

  @Get(':id')
  @Roles(Role.ADMIN)
  @ResponseMessage('School retrieved')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.schoolService.findById(id, user.schoolId);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @ResponseMessage('School profile updated')
  updateProfile(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSchoolProfileDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.schoolService.updateProfile(id, user.schoolId, dto);
  }

  @Patch(':id/settings')
  @Roles(Role.ADMIN)
  @ResponseMessage('School settings updated')
  updateSettings(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: PatchSchoolSettingsDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.schoolService.updateSettings(id, user.schoolId, dto);
  }

  @Post(':id/backup')
  @Roles(Role.ADMIN)
  @ResponseMessage('Backup requested')
  createBackup(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.schoolService.createBackup(id, user.schoolId);
  }
}
