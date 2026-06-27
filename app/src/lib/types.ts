// User shape exposed to load functions / the client. Never include tokens.
export interface SessionUser {
	id: string;
	email: string;
	name: string | null;
	role: 'camper' | 'admin';
	identityVerified: boolean;
	onboarded: boolean;
}

export interface Address {
	line1: string;
	line2?: string;
	city: string;
	state: string;
	zip: string;
	country: string;
}
