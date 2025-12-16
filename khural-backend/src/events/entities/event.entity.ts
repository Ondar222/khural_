import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("events")
export class EventEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, nullable: true })
  externalId?: string;

  // Stored as YYYY-MM-DD
  @Column({ type: "date" })
  date: string;

  @Column()
  title: string;

  @Column({ nullable: true })
  time?: string;

  @Column({ nullable: true })
  place?: string;

  @Column({ type: "text", nullable: true })
  desc?: string;
}



