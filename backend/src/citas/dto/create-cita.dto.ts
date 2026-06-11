import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsArray, IsOptional } from 'class-validator';

export class CreateCitaDto {
  @ApiProperty({ example: 'Juan Pérez', description: 'Nombre del cliente' })
  @IsString()
  @IsNotEmpty()
  usuario: string;

  @ApiProperty({ example: '2026-06-15', description: 'Fecha de la visita (YYYY-MM-DD)' })
  @IsString()
  @IsNotEmpty()
  fecha: string;

  @ApiProperty({ example: '10:00', description: 'Hora de inicio' })
  @IsString()
  @IsNotEmpty()
  horaInicio: string;

  @ApiProperty({ example: '12:00', description: 'Hora de fin' })
  @IsString()
  @IsNotEmpty()
  horaFin: string;

  @ApiPropertyOptional({ example: ['Cocina Nogal Bicolor', 'Escritorio en L'] })
  @IsOptional()
  @IsArray()
  piezas?: string[];

  @ApiPropertyOptional({ example: 'Necesito medidas para recámara de 4x4 metros.' })
  @IsOptional()
  @IsString()
  mensaje?: string;
}