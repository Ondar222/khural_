import { ConflictException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { LogsEntity } from "./logger.entity";
import { ELoggerType } from "../lib/types/logger";
import { Request } from "express";

interface Loggable {
	log: (message: unknown, context?: string) => void;
	error: (message: string, trace: string, context?: string) => void;
	warn: (message: string, context?: string) => void;
	debug: (message: string, context?: string) => void;
	verbose: (message: string, context?: string) => void;
}

abstract class BasicLoggerService implements Loggable {
	constructor(
		@InjectRepository(LogsEntity)
		loggerRepository: Repository<LogsEntity>
	) {}

	log: (message: unknown, context?: string | undefined) => void;
	error: (message: string, trace: string, context?: string | undefined) => void;
	warn: (message: string, context?: string | undefined) => void;
	debug: (message: string, context?: string | undefined) => void;
	verbose: (message: string, context?: string | undefined) => void;
}

@Injectable()
class HotelLogger extends BasicLoggerService {
	constructor(
		@InjectRepository(LogsEntity)
		loggerRepository: Repository<LogsEntity>
	) {
		super(loggerRepository);
	}
}

@Injectable()
class BookingLogger extends BasicLoggerService {
	log: (message: unknown, context?: string | undefined) => {};
}

@Injectable()
class LoggerFactory {
	constructor(
		@InjectRepository(LogsEntity)
		private readonly loggerRepository: Repository<LogsEntity>
	) {}

	async createLogger({
		type,
		userId,
		request,
	}: {
		type: ELoggerType;
		userId: string;
		request: Request;
	}) {
		try {
			switch (type) {
				case ELoggerType.Booking: {
					return new BookingLogger(this.loggerRepository);
				}
			}
		} catch (e) {
			throw new ConflictException();
		}
	}
}

export { LoggerFactory };
