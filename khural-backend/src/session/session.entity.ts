import {
	Column,
	Entity,
	PrimaryColumn,
} from "typeorm";

@Entity({ name: "sessions" })
export class Session {
	@PrimaryColumn("character varying")
	token: string;

	@Column("uuid")
	user: string;

	scope: string; // vk, yandex, tbank, gos

	@Column()
	expires: string;

	@Column({ nullable: true })
	ip: string;

	@Column({ nullable: true })
	user_agent: string;

	@Column({ nullable: true })
	origin: string;
}
