import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'João Vigilante', description: 'Nome completo' })
  @IsString()
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  nome: string;

  @ApiProperty({ example: 'joao@ronda.com', description: 'E-mail do usuário' })
  @IsEmail({}, { message: 'E-mail inválido' })
  @IsNotEmpty({ message: 'E-mail é obrigatório' })
  email: string;

  @ApiProperty({ example: 'senha123', description: 'Senha do usuário' })
  @IsString()
  @IsNotEmpty({ message: 'Senha é obrigatória' })
  @MinLength(6, { message: 'A senha deve ter no mínimo 6 caracteres' })
  senha: string;

  @ApiProperty({ example: 'VIGILANTE', enum: ['ADMIN', 'SUPERVISOR', 'VIGILANTE'], description: 'Papel/Função do usuário' })
  @IsEnum(['ADMIN', 'SUPERVISOR', 'VIGILANTE'], { message: 'Role inválida. Escolha ADMIN, SUPERVISOR ou VIGILANTE' })
  role: 'ADMIN' | 'SUPERVISOR' | 'VIGILANTE';
}
