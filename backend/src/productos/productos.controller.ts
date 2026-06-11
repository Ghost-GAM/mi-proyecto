import {
  Controller, Get, Post, Put, Delete,
  Param, Body, Query,
} from '@nestjs/common';
import {
  ApiTags, ApiOperation, ApiResponse,
  ApiParam, ApiQuery,
} from '@nestjs/swagger';
import { ProductosService } from './productos.service';
import { CreateProductoDto } from './dto/create-producto.dto';

@ApiTags('productos')
@Controller('productos')
export class ProductosController {
  constructor(private readonly productosService: ProductosService) {}

  @Get()
  @ApiOperation({ summary: 'Obtener todos los productos del catálogo' })
  @ApiQuery({ name: 'categoria', required: false, description: 'Filtrar por categoría', enum: ['Cocina', 'Sala', 'Recámara', 'Oficina'] })
  @ApiResponse({ status: 200, description: 'Lista de productos' })
  findAll(@Query('categoria') categoria?: string) {
    return this.productosService.findAll(categoria);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un producto por su ID' })
  @ApiParam({ name: 'id', example: 'cocina-nogal' })
  @ApiResponse({ status: 200, description: 'Producto encontrado' })
  @ApiResponse({ status: 404, description: 'Producto no encontrado' })
  findOne(@Param('id') id: string) {
    return this.productosService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Crear un nuevo producto (solo admin)' })
  @ApiResponse({ status: 201, description: 'Producto creado exitosamente' })
  create(@Body() createProductoDto: CreateProductoDto) {
    return this.productosService.create(createProductoDto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar un producto existente (solo admin)' })
  @ApiParam({ name: 'id', example: 'cocina-nogal' })
  @ApiResponse({ status: 200, description: 'Producto actualizado' })
  @ApiResponse({ status: 404, description: 'Producto no encontrado' })
  update(@Param('id') id: string, @Body() dto: Partial<CreateProductoDto>) {
    return this.productosService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un producto (solo admin)' })
  @ApiParam({ name: 'id', example: 'cocina-nogal' })
  @ApiResponse({ status: 200, description: 'Producto eliminado' })
  @ApiResponse({ status: 404, description: 'Producto no encontrado' })
  remove(@Param('id') id: string) {
    return this.productosService.remove(id);
  }
}