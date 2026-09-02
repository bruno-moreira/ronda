import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class StartPatrolDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'ID da rota que será percorrida' })
  @IsUUID()
  @IsNotEmpty()
  routeId: string;
}
