import { Injectable } from "@nestjs/common";
import { ContactRepository } from "./contact.repository";

@Injectable()
export class ContactService {
	constructor(private contactRepository: ContactRepository) {}

	async setContacts(hotelId: number, dto) {
		return await this.contactRepository.upsert(
			{
				hotel: {
					id: hotelId,
				},
				...dto,
			},
			{
				conflictPaths: {
					id: true,
				},
			}
		);
	}
}
