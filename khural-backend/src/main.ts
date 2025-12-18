import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ExtractBearerTokenMiddleware } from './common/middlewares/ExtractBearerTokenMiddleware';
import { AttachAccountabilityMiddleware } from './common/middlewares/AttachAccountabilityMiddleware';
// TODO: Установить @nestjs/throttler для rate limiting
// import { ThrottlerGuard } from '@nestjs/throttler';
// import { APP_GUARD } from '@nestjs/core';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // TODO: Раскомментировать после установки @nestjs/throttler
  // app.useGlobalGuards(new ThrottlerGuard());

  const extractBearerTokenMiddleware = new ExtractBearerTokenMiddleware();
  app.use(extractBearerTokenMiddleware.use.bind(extractBearerTokenMiddleware));

  const attachAccountabilityMiddleware = new AttachAccountabilityMiddleware();
  app.use(attachAccountabilityMiddleware.use.bind(attachAccountabilityMiddleware));

  // Настройка Swagger документации
  const config = new DocumentBuilder()
    .setTitle('Khural Backend API')
    .setDescription('API для управления депутатами, новостями и пользователями')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Введите JWT токен',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  await app.listen(process.env.PORT ?? 4000);
  console.log(`Приложение запущено на http://localhost:${process.env.PORT ?? 4000}`);
  console.log(`Swagger документация доступна на http://localhost:${process.env.PORT ?? 4000}/api`);
}
bootstrap();
