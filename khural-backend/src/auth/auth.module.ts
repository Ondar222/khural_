import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { AuthService } from './auth.service';
import { AuthController } from './controllers/auth.controller';
import { SessionService } from '../session/session.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Session } from '../session/session.entity';
import { PassportModule } from '@nestjs/passport';
import { VkStrategy } from './oauth/vk.strategy';
import { HttpModule } from '@nestjs/axios';
import { OauthController } from './controllers/oauth.controller';
import { UserModule } from '../user/user.module';

@Module({
	imports: [
		TypeOrmModule.forFeature([Session]),
		CacheModule.register(),
		PassportModule.register({ defaultStrategy: "vkontakte" }),
		HttpModule.register({
			timeout: 5000,
			maxRedirects: 5,
		}),
		UserModule,
	],
	providers: [
		AuthService,
		SessionService,
		VkStrategy,
	],
	controllers: [AuthController, OauthController],
	exports: [TypeOrmModule, AuthService],
})
export class AuthModule {}
