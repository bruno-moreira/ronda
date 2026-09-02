import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsDateString, IsNotEmpty, IsOptional, IsString, IsUUID, ValidateNested } from 'class-validator';

export class SinglePatrolLogDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'ID local do log no mobile ou UUID' })
  @IsString()
  @IsNotEmpty()
  localId: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'ID da sessão de ronda' })
  @IsString()
  @IsNotEmpty()
  sessionId: string;

  @ApiPropertyOptional({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'ID do checkpoint ou null se buscado por qrCodeHash' })
  @IsOptional()
  @IsString()
  checkpointId?: string;

  @ApiPropertyOptional({ example: 'a1b2c3d4e5f6...', description: 'Hash do QR Code lido pelo mobile' })
  @IsOptional()
  @IsString()
  qrCodeHash?: string;

  @ApiProperty({ example: '2026-08-04T11:30:00.000Z', description: 'Data/hora exata em que o QR Code foi lido offline' })
  @IsDateString()
  @IsNotEmpty()
  scannedAt: string;
}

export class SyncPatrolLogsDto {
  @ApiProperty({ type: [SinglePatrolLogDto], description: 'Array de registros de leitura efetuados offline' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SinglePatrolLogDto)
  logs: SinglePatrolLogDto[];
}
