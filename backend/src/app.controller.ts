import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Health')
@Controller()
export class AppController {
  @Get('ping')
  @ApiOperation({ summary: 'Endpoint público para teste de conectividade (Ping/Health Check)' })
  ping() {
    return { status: 'ok', message: 'Servidor Ronda Security online', timestamp: new Date().toISOString() };
  }
}
