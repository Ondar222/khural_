import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("logs")
export class LogsEntity {
	@PrimaryGeneratedColumn("uuid")
	id: string;

	@Column({ nullable: true })
	request_id?: string;

	@Column({ nullable: true })
	user_id?: string;

	@Column({ type: "jsonb", nullable: true })
	request?: Record<string, unknown>;
}

abstract class LogSubEntity {
	@PrimaryGeneratedColumn("uuid")
	id: string;

	@Column({ nullable: true })
	log_id?: string;
}

@Entity("logs_error")
export class ErrorLogsEntity extends LogSubEntity {
	@Column({ nullable: true })
	action?: string;
}

@Entity("logs_hotel")
export class HotelLogsEntity extends LogSubEntity {
	@Column({ nullable: true })
	hotel_id?: string;

	@Column({ nullable: true })
	action?: string;
}

@Entity("logs_booking")
export class BookingLogsEntity extends LogSubEntity {
	@Column({ nullable: true })
	booking_id?: string;
}

@Entity("logs_user")
export class UserLogsEntity extends LogSubEntity {}

@Entity("logs_otp")
export class OtpLogsEntity extends LogSubEntity {
	@Column({ nullable: true })
	action?: string;

	@Column({ nullable: true })
	phone?: string;
}

@Entity("logs_auth")
export class AuthLogsEntity extends LogSubEntity {}
