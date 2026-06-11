import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('general')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Verifica que la API está funcionando' })
  getStatus(): object {
    return this.appService.getStatus();
  }

  @Get('health')
  @ApiOperation({ summary: 'Health check del servidor' })
  getHealth(): object {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}