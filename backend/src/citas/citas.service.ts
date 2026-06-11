import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCitaDto } from './dto/create-cita.dto';

@Injectable()
export class CitasService {
  // Datos en memoria (en producción se conectaría a Firestore)
  private citas = [
    {
      id: 1,
      usuario: 'Cliente Demo',
      fecha: '2026-06-15',
      horaInicio: '10:00',
      horaFin: '12:00',
      piezas: ['Cocina Nogal Bicolor'],
      mensaje: 'Necesito medidas para una cocina de 4 metros.',
      estado: 'pendiente',
      creadaEn: new Date().toISOString(),
    },
  ];
  private nextId = 2;

  findAll(estado?: string) {
    if (estado) {
      return this.citas.filter(c => c.estado === estado);
    }
    return this.citas;
  }

  findOne(id: number) {
    const cita = this.citas.find(c => c.id === id);
    if (!cita) {
      throw new NotFoundException(`Cita con id ${id} no encontrada`);
    }
    return cita;
  }

  create(dto: CreateCitaDto) {
    const nueva = {
      id: this.nextId++,
      usuario: dto.usuario,
      fecha: dto.fecha,
      horaInicio: dto.horaInicio,
      horaFin: dto.horaFin,
      piezas: dto.piezas || [],
      mensaje: dto.mensaje || '',
      estado: 'pendiente',
      creadaEn: new Date().toISOString(),
    };
    this.citas.push(nueva);
    return nueva;
  }

  confirmar(id: number) {
    const cita = this.findOne(id);
    cita.estado = 'confirmada';
    return { mensaje: `Cita ${id} confirmada`, cita };
  }

  cancelar(id: number) {
    const cita = this.findOne(id);
    cita.estado = 'cancelada';
    return { mensaje: `Cita ${id} cancelada`, cita };
  }

  remove(id: number) {
    const index = this.citas.findIndex(c => c.id === id);
    if (index === -1) {
      throw new NotFoundException(`Cita con id ${id} no encontrada`);
    }
    const eliminada = this.citas.splice(index, 1);
    return { mensaje: `Cita ${id} eliminada`, cita: eliminada[0] };
  }
}