import { Module } from "@nestjs/common";
import { SessionService } from "./session.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Session } from "./session.entity";


@Module({
	imports: [TypeOrmModule.forFeature([Session])],
	providers: [SessionService],
	exports: [TypeOrmModule],
})
export class SessionModule {}
