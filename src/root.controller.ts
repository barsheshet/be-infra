import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { RootService } from './root.service';
import { ConfigDto } from './root.dto';

@ApiTags('Root')
@Controller()
export class RootController {
  constructor(private readonly rootService: RootService) {}

  @Get()
  getStatus(): string {
    return this.rootService.getStatus();
  }

  @Get('getConfig')
  getConfig(): ConfigDto {
    return this.rootService.getConfig();
  }
}
