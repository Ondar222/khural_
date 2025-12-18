import {
	Column,
	Entity,
	JoinColumn,
	OneToOne,
	PrimaryGeneratedColumn,
} from "typeorm";
// import { Hotel } from "../../apps/lana-food/hotel/entities/hotel.entity";

@Entity({ name: "contacts" })
export class Contact {
	@PrimaryGeneratedColumn()
	id: number;

	@Column({ nullable: true })
	email: string;

	@Column({ nullable: true })
	phone: string;

	// @OneToOne(() => Hotel, (hotel) => hotel.contacts, {
	// 	cascade: true,
	// 	onUpdate: "CASCADE",
	// 	onDelete: "CASCADE",
	// })
	// @JoinColumn({
	// 	name: "hotel_id",
	// })
	// hotel: Hotel;
}
