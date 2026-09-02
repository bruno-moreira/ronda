import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ example: 'Carlos Vigilante' })
  @IsString()
  @IsNotEmpty()
  nome: string;

  @ApiProperty({ example: 'carlos@ronda.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'senha123' })
  @IsString()
  @MinLength(6)
  senha: string;

  @ApiProperty({ example: 'VIGILANTE', enum: ['ADMIN', 'SUPERVISOR', 'VIGILANTE'] })
  @IsEnum(['ADMIN', 'SUPERVISOR', 'VIGILANTE'])
  role: 'ADMIN' | 'SUPERVISOR' | 'VIGILANTE';
}
