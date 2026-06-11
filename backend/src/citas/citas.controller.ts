import {
  Controller, Get, Post, Put, Delete,
  Param, Body, Query, ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags, ApiOperation, ApiResponse,
  ApiParam, ApiQuery,
} from '@nestjs/swagger';
import { CitasService } from './citas.service';
import { CreateCitaDto } from './dto/create-cita.dto';

@ApiTags('citas')
@Controller('citas')
export class CitasController {
  constructor(private readonly citasService: CitasService) {}

  @Get()
  @ApiOperation({ summary: 'Obtener todas las solicitudes de cita (solo admin)' })
  @ApiQuery({ name: 'estado', required: false, enum: ['pendiente', 'confirmada', 'cancelada'] })
  @ApiResponse({ status: 200, description: 'Lista de citas' })
  findAll(@Query('estado') estado?: string) {
    return this.citasService.findAll(estado);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una cita por su ID' })
  @ApiParam({ name: 'id', example: 1 })
  @ApiResponse({ status: 200, description: 'Cita encontrada' })
  @ApiResponse({ status: 404, description: 'Cita no encontrada' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.citasService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Crear una nueva solicitud de cita' })
  @ApiResponse({ status: 201, description: 'Cita creada exitosamente' })
  create(@Body() createCitaDto: CreateCitaDto) {
    return this.citasService.create(createCitaDto);
  }

  @Put(':id/confirmar')
  @ApiOperation({ summary: 'Confirmar una cita (solo admin)' })
  @ApiParam({ name: 'id', example: 1 })
  @ApiResponse({ status: 200, description: 'Cita confirmada' })
  confirmar(@Param('id', ParseIntPipe) id: number) {
    return this.citasService.confirmar(id);
  }

  @Put(':id/cancelar')
  @ApiOperation({ summary: 'Cancelar una cita (solo admin)' })
  @ApiParam({ name: 'id', example: 1 })
  @ApiResponse({ status: 200, description: 'Cita cancelada' })
  cancelar(@Param('id', ParseIntPipe) id: number) {
    return this.citasService.cancelar(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar una cita (solo admin)' })
  @ApiParam({ name: 'id', example: 1 })
  @ApiResponse({ status: 200, description: 'Cita eliminada' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.citasService.remove(id);
  }
}