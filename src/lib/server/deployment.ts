export const HOSTED_DEMO_MESSAGE =
	'The hosted preview is disposable and does not accept profile or application changes. Run the app locally for private, durable use.';

export function isHostedDemo(): boolean {
	return process.env.JOB_ASSISTANT_HOSTED_DEMO === '1' || Boolean(process.env.VERCEL);
}
