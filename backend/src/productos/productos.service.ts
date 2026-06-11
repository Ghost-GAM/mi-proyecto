import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateProductoDto } from './dto/create-producto.dto';

@Injectable()
export class ProductosService {
  // Datos en memoria (en producción se conectaría a Firestore)
  private productos = [
    {
      id: 'cocina-nogal',
      nombre: 'Cocina Nogal Bicolor',
      categoria: 'Cocina',
      descripcion: 'Cocina de dos tonos en madera nogal natural con isla central y herrajes de acero inoxidable.',
      madera: 'Nogal natural',
      medidas: '3.2 × 0.6 m',
      acabado: 'Mate satín',
      badge: 'Destacado',
      imgs: ['https://i.imgur.com/lWCfKuo.jpeg', 'https://i.imgur.com/Zs2ppDI.jpeg'],
    },
    {
      id: 'cocina-negra',
      nombre: 'Cocina Negra Premium',
      categoria: 'Cocina',
      descripcion: 'Cocina en acabado negro mate con encimera de mármol y luz LED integrada.',
      madera: 'MDF lacado negro',
      medidas: '4.0 × 0.65 m',
      acabado: 'Lacado negro mate',
      badge: 'Premium',
      imgs: ['https://i.imgur.com/6TCGqVu.jpeg', 'https://i.imgur.com/gOnkz6q.jpeg'],
    },
    {
      id: 'cocina-clara',
      nombre: 'Cocina Moderna Clara',
      categoria: 'Cocina',
      descripcion: 'Cocina minimalista en tonos claros con acabados de alta calidad.',
      madera: 'Melamina blanco perla',
      medidas: '3.0 × 0.6 m',
      acabado: 'Brillante',
      badge: 'Nuevo',
      imgs: ['https://i.imgur.com/v9Bxedg.jpeg'],
    },
    {
      id: 'mueble-tv',
      nombre: 'Mueble TV con Panel',
      categoria: 'Sala',
      descripcion: 'Mueble de entretenimiento con panel decorativo de madera y cajones con cierre suave.',
      madera: 'Roble europeo',
      medidas: '2.4 × 0.45 m',
      acabado: 'Satinado natural',
      badge: '',
      imgs: ['https://i.imgur.com/2SAwlJ5.jpeg'],
    },
    {
      id: 'escritorio-l',
      nombre: 'Escritorio en L',
      categoria: 'Oficina',
      descripcion: 'Escritorio en forma de L ideal para home office, con cajones y espacio para monitor.',
      madera: 'Encino claro',
      medidas: '1.8 × 1.5 m',
      acabado: 'Mate natural',
      badge: '',
      imgs: ['https://i.imgur.com/lZ1fS2j.jpeg', 'https://i.imgur.com/cw4Lt8P.jpeg'],
    },
    {
      id: 'closet-moderno',
      nombre: 'Closet con Cajonera',
      categoria: 'Recámara',
      descripcion: 'Closet moderno con área de colgado, cajones y espejo integrado.',
      madera: 'Melamina texturizada',
      medidas: '2.4 × 0.6 × 2.4 m',
      acabado: 'Texturizado gris',
      badge: '',
      imgs: ['https://i.imgur.com/wL6aV37.jpeg'],
    },
  ];

  findAll(categoria?: string) {
    if (categoria) {
      return this.productos.filter(p =>
        p.categoria.toLowerCase() === categoria.toLowerCase()
      );
    }
    return this.productos;
  }

  findOne(id: string) {
    const producto = this.productos.find(p => p.id === id);
    if (!producto) {
      throw new NotFoundException(`Producto con id "${id}" no encontrado`);
    }
    return producto;
  }

  create(dto: CreateProductoDto) {
    const existe = this.productos.find(p => p.id === dto.id);
    if (existe) {
      throw new Error(`Ya existe un producto con id "${dto.id}"`);
    }
    const nuevo = { ...dto, nombre: dto.nombre };
    this.productos.push(nuevo as any);
    return nuevo;
  }

  update(id: string, dto: Partial<CreateProductoDto>) {
    const index = this.productos.findIndex(p => p.id === id);
    if (index === -1) {
      throw new NotFoundException(`Producto con id "${id}" no encontrado`);
    }
    this.productos[index] = { ...this.productos[index], ...dto };
    return this.productos[index];
  }

  remove(id: string) {
    const index = this.productos.findIndex(p => p.id === id);
    if (index === -1) {
      throw new NotFoundException(`Producto con id "${id}" no encontrado`);
    }
    const eliminado = this.productos.splice(index, 1);
    return { mensaje: `Producto "${id}" eliminado correctamente`, producto: eliminado[0] };
  }
}