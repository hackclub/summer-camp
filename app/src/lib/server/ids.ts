import { randomBytes } from 'node:crypto';

// URL-safe random IDs for primary keys. 16 bytes ≈ UUID-strength.
export function newId(): string {
	return randomBytes(16).toString('base64url');
}
