import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsArray, IsOptional } from 'class-validator';

export class CreateProductoDto {
  @ApiProperty({ example: 'cocina-roble', description: 'ID único del producto' })
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty({ example: 'Cocina Roble Natural' })
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @ApiProperty({ example: 'Cocina', enum: ['Cocina', 'Sala', 'Recámara', 'Oficina'] })
  @IsString()
  @IsNotEmpty()
  categoria: string;

  @ApiProperty({ example: 'Cocina hecha a medida con isla y barra de servicio.' })
  @IsString()
  @IsNotEmpty()
  descripcion: string;

  @ApiPropertyOptional({ example: 'Roble americano' })
  @IsOptional()
  @IsString()
  madera?: string;

  @ApiPropertyOptional({ example: '3.5 × 0.65 m' })
  @IsOptional()
  @IsString()
  medidas?: string;

  @ApiPropertyOptional({ example: 'Mate satín' })
  @IsOptional()
  @IsString()
  acabado?: string;

  @ApiPropertyOptional({ example: 'Destacado', enum: ['Destacado', 'Premium', 'Nuevo', ''] })
  @IsOptional()
  @IsString()
  badge?: string;

  @ApiProperty({ example: ['https://res.cloudinary.com/...'] })
  @IsArray()
  imgs: string[];
}