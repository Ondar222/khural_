export class MongoLoggerService {
	constructor(private readonly scope: string = "logs") {}

	info(message: string, metadata?: Record<string, unknown>) {
		// eslint-disable-next-line no-console
		console.info(this.formatMessage("INFO", message, metadata));
	}

	error(message: string, metadata?: Record<string, unknown>) {
		// eslint-disable-next-line no-console
		console.error(this.formatMessage("ERROR", message, metadata));
		if (metadata?.stack) {
			// eslint-disable-next-line no-console
			console.error(metadata.stack);
		}
	}

	warn(message: string, metadata?: Record<string, unknown>) {
		// eslint-disable-next-line no-console
		console.warn(this.formatMessage("WARN", message, metadata));
	}

	private formatMessage(
		level: string,
		message: string,
		metadata?: Record<string, unknown>
	) {
		const timestamp = new Date().toISOString();
		const payload = metadata ? JSON.stringify(metadata) : "";
		return `[${timestamp}] [${this.scope}] ${level}: ${message} ${payload}`;
	}
}
