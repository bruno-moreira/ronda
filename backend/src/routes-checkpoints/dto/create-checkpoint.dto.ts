import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CreateCheckpointDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'ID da rota vinculada' })
  @IsUUID()
  @IsNotEmpty()
  routeId: string;

  @ApiProperty({ example: 'Guarita Principal' })
  @IsString()
  @IsNotEmpty()
  nome: string;

  @ApiProperty({ example: -23.55052 })
  @IsNumber()
  latitude: number;

  @ApiProperty({ example: -46.633308 })
  @IsNumber()
  longitude: number;

  @ApiPropertyOptional({ example: 1, description: 'Ordem sequencial na rota (1, 2, 3...)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  ordem?: number;
}
