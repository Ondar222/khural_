import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

@Module({
	imports: [
		TypeOrmModule.forFeature([
			// User,
			// Role,
			// Otp,
			// Session,
			// Hotel,

			// Room,
			// Booking,
			// Roomlock,
			// BookingLock,

			// AddressEntity,
			// Files,

			// Calendar,
			// Contact,

			// logs
			// LogsEntity,
			// ErrorLogsEntity,
			// HotelLogsEntity,
			// BookingLogsEntity,
			// AuthLogsEntity,
			// OtpLogsEntity,
		]),
	],
	providers: [],
	exports: [TypeOrmModule],
})
export class LoggerModule {}
