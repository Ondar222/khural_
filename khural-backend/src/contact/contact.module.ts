import { Module } from "@nestjs/common";
import { ContactRepository } from "./contact.repository";
import { ContactService } from "./contact.service";

@Module({
	imports: [],
	providers: [ContactService, ContactRepository],
	exports: [ContactRepository],
})
export class ContactModule {}
