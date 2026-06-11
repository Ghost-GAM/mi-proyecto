import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getStatus(): object {
    return {
      nombre: "Pablo's Carpintería API",
      version: '1.0.0',
      descripcion: 'API REST para gestión de productos y citas de carpintería',
      documentacion: '/api/docs',
      endpoints: ['/productos', '/citas'],
      timestamp: new Date().toISOString(),
    };
  }
}