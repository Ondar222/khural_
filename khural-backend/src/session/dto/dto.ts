class SessionCreationDto {
	token: string;
	user: string;
	expires: string;
	ip?: string;
	user_agent?: string;
	share?: string;
	origin?: string;
}

class SessionUpdationDto {
	token: string;
	user?: string;
	expires?: string;
	ip?: string;
	user_agent?: string;
	origin?: string;
}

export { SessionCreationDto, SessionUpdationDto };
