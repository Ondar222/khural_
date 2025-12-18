import { Module } from '@nestjs/common';
import { EsiaController } from './esia.controller';
import { EsiaService } from './esia.service';

@Module({
  controllers: [EsiaController],
  providers: [EsiaService],
  exports: [EsiaService],
})
export class EsiaModule {}

