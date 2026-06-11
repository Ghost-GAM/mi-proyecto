import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProductosModule } from './productos/productos.module';
import { CitasModule } from './citas/citas.module';

@Module({
  imports: [ProductosModule, CitasModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}