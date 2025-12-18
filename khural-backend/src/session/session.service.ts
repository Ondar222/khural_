import { BadRequestException, Injectable } from "@nestjs/common";
import { Session } from "./session.entity";
import { Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { SessionCreationDto, SessionUpdationDto } from "./dto/dto";

@Injectable()
export class SessionService {
	constructor(
		@InjectRepository(Session)
		private sessionRepository: Repository<Session>
	) {}

	async create(dto: SessionCreationDto) {
		try {
			const sessionCreate = this.sessionRepository.create({
				token: dto.token,
				user: dto.user,
				expires: dto.expires,
				ip: dto.ip,
				user_agent: dto.user_agent,
				origin: dto.origin,
			});
			return await this.sessionRepository.save(sessionCreate);
		} catch (e) {
			throw new BadRequestException();
		}
	}

	async update(dto: SessionUpdationDto) {
		try {
			await this.sessionRepository.update(
				{
					token: dto.token,
				},
				{
					user: dto.user,
					expires: dto.expires,
					ip: dto.ip,
					user_agent: dto.user_agent,
					origin: dto.origin,
				}
			);
		} catch (e) {
			throw new BadRequestException();
		}
	}

	async getByToken(token: string) {
		return await this.sessionRepository.findOneBy({ token: token });
	}
}
