import { dev } from '$app/environment';
import { env } from '$env/dynamic/private';

/** Sends the magic-link email via Resend's HTTP API. In dev (or with no API
 *  key) the link is logged to the server console instead, so the whole login
 *  flow works locally without an email provider. */
export async function sendMagicLink(email: string, link: string): Promise<void> {
	if (dev || !env.RESEND_API_KEY) {
		console.log(`[email] magic link for ${email}: ${link}`);
		return;
	}

	const res = await fetch('https://api.resend.com/emails', {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${env.RESEND_API_KEY}`,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			from: env.EMAIL_FROM ?? 'Hack Club Summer Camp <camp@hackclub.com>',
			to: [email],
			subject: 'Your Summer Camp login link',
			html: [
				'<div style="font-family:sans-serif;max-width:480px;margin:0 auto">',
				'<h1 style="color:#a3523b">Hack Club Summer Camp</h1>',
				'<p>Click the button below to log in. This link works once and expires in 15 minutes.</p>',
				`<p style="margin:24px 0"><a href="${link}" style="background:#80b464;color:#fff;padding:12px 24px;border-radius:9999px;text-decoration:none;font-weight:bold">Log in to camp</a></p>`,
				`<p style="color:#666;font-size:12px">Or paste this URL into your browser:<br>${link}</p>`,
				'<p style="color:#666;font-size:12px">If you didn\'t request this, you can ignore this email.</p>',
				'</div>'
			].join('')
		})
	});

	if (!res.ok) {
		throw new Error(`Resend API error ${res.status}: ${await res.text()}`);
	}
}
