import { Controller, Get, Post, Delete, Param, Body, UseGuards, Patch } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { RoutesCheckpointsService } from './routes-checkpoints.service';
import { CreateRouteDto } from './dto/create-route.dto';
import { CreateCheckpointDto } from './dto/create-checkpoint.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@ApiTags('Routes & Checkpoints')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('routes')
export class RoutesCheckpointsController {
  constructor(private readonly service: RoutesCheckpointsService) {}

  @Get()
  @ApiOperation({ summary: 'Lista todas as rotas com seus checkpoints' })
  findAllRoutes() {
    return this.service.findAllRoutes();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtém rota por ID' })
  findRouteById(@Param('id') id: string) {
    return this.service.findRouteById(id);
  }

  @Post()
  @Roles('ADMIN', 'SUPERVISOR')
  @ApiOperation({ summary: 'Cria nova rota' })
  createRoute(@Body() dto: CreateRouteDto) {
    return this.service.createRoute(dto);
  }

  @Delete(':id')
  @Roles('ADMIN', 'SUPERVISOR')
  @ApiOperation({ summary: 'Remove rota' })
  deleteRoute(@Param('id') id: string) {
    return this.service.deleteRoute(id);
  }

  @Post('checkpoints')
  @Roles('ADMIN', 'SUPERVISOR')
  @ApiOperation({ summary: 'Adiciona checkpoint a uma rota e gera o hash único de QR Code' })
  createCheckpoint(@Body() dto: CreateCheckpointDto) {
    return this.service.createCheckpoint(dto);
  }

  @Patch('checkpoints/:id/qr-code-hash')
  @Roles('ADMIN', 'SUPERVISOR')
  @ApiOperation({ summary: 'Regera o hash único do QR Code para um checkpoint' })
  regenerateQrHash(@Param('id') id: string) {
    return this.service.regenerateQrCodeHash(id);
  }

  @Delete('checkpoints/:id')
  @Roles('ADMIN', 'SUPERVISOR')
  @ApiOperation({ summary: 'Remove checkpoint' })
  deleteCheckpoint(@Param('id') id: string) {
    return this.service.deleteCheckpoint(id);
  }
}
