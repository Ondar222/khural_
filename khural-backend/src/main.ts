import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

function parseCorsOrigins() {
  const raw = (process.env.CORS_ORIGIN || '').trim();
  const allowVercel = process.env.CORS_ALLOW_VERCEL === 'true';

  // Defaults:
  // - In dev: allow any origin (handy when switching ports / using tunneling)
  // - In prod: be strict unless explicitly configured
  const allowAllByDefault = process.env.NODE_ENV !== 'production' && !raw;

  const allowed = raw
    ? raw
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    : [
        'http://localhost:5173', // Vite dev server
        'http://localhost:3000', // same-origin prod / local reverse proxy
      ];

  return {
    allowed,
    allowAllByDefault,
    allowVercel,
  };
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS for frontend
  const cors = parseCorsOrigins();
  app.enableCors({
    origin: (origin, callback) => {
      // Allow non-browser requests (curl/postman) without Origin header
      if (!origin) return callback(null, true);

      if (cors.allowAllByDefault) return callback(null, true);

      if (cors.allowVercel && /^https:\/\/.+\.vercel\.app$/.test(origin)) {
        return callback(null, true);
      }

      if (cors.allowed.includes(origin)) return callback(null, true);

      // Don't throw hard errors on server side; just disable CORS for this origin.
      return callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  await app.listen(process.env.PORT ?? 3000);
  console.log(`🚀 Backend server is running on http://localhost:${process.env.PORT ?? 3000}`);
}
bootstrap();
