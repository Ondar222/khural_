import { Module } from '@nestjs/common';
import { TranslationController } from './translation.controller';
import { TranslationService } from './translation.service';
import { MockTranslationProvider } from './providers/mock-translation.provider';
import { ITranslationProvider } from './interfaces/translation-provider.interface';

@Module({
  controllers: [TranslationController],
  providers: [
    TranslationService,
    MockTranslationProvider,
    {
      provide: 'ITranslationProvider',
      useClass: MockTranslationProvider,
    },
  ],
  exports: [TranslationService],
})
export class TranslationModule {}

