import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class CreateRouteDto {
  @ApiProperty({ example: 'Ronda Perímetro Norte' })
  @IsString()
  @IsNotEmpty()
  nome: string;

  @ApiPropertyOptional({ example: 'Verificação dos portões e guaritas da zona norte' })
  @IsString()
  @IsOptional()
  descricao?: string;

  @ApiProperty({ example: 4, description: 'Quantidade mínima de checkpoints para validar a ronda' })
  @IsInt()
  @Min(1)
  qtdeMinimaCheckpoints: number;

  @ApiProperty({ example: true, description: 'Exige que os checkpoints sejam lidos na ordem definida' })
  @IsBoolean()
  isOrdered: boolean;
}
