import { Controller, Post, Get, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PatrolService } from './patrol.service';
import { StartPatrolDto } from './dto/start-patrol.dto';
import { SyncPatrolLogsDto } from './dto/sync-patrol-log.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Patrol Core')
@Controller('patrol')
export class PatrolController {
  constructor(private readonly patrolService: PatrolService) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('start')
  @ApiOperation({ summary: 'Inicia uma nova sessão de ronda para o usuário autenticado' })
  startSession(@Request() req: any, @Body() dto: StartPatrolDto) {
    return this.patrolService.startSession(req.user.userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('sessions')
  @ApiOperation({ summary: 'Lista sessões de ronda' })
  getSessions(@Request() req: any) {
    // Se for Vigilante vê as dele, se for Admin/Supervisor vê todas
    const userId = req.user.role === 'VIGILANTE' ? req.user.userId : undefined;
    return this.patrolService.getActiveSessions(userId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('sessions/:id')
  @ApiOperation({ summary: 'Obtém detalhes de uma sessão de ronda por ID' })
  getSessionDetails(@Param('id') id: string) {
    return this.patrolService.getSessionDetails(id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('reports')
  @ApiOperation({ summary: 'Gera dados para o Relatório Coletas (Filtros: período, rota, rondante)' })
  getReport(
    @Request() req: any,
    @Body() body?: any,
  ) {
    const query = req.query || {};
    return this.patrolService.getPatrolReport({
      startDate: query.startDate,
      endDate: query.endDate,
      routeId: query.routeId,
      userId: query.userId,
    });
  }

  @Post('sync')
  @ApiOperation({
    summary: 'Core: Recebe array de PatrolLog gerados offline pelo mobile e valida a ronda (Acesso Livre para Dispositivos de Campo)',
  })
  @ApiResponse({
    status: 200,
    description: 'Relatório detalhado do resultado do sync e encerramento/validação de sessões',
  })
  syncLogs(@Body() dto: SyncPatrolLogsDto) {
    return this.patrolService.syncPatrolLogs(dto);
  }
}
