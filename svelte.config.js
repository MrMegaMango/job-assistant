import adapter from '@sveltejs/adapter-vercel';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		csrf: {
			// Vercel can invoke the function through an internal deployment URL while the
			// browser submits from the stable production alias. Trust only that alias so
			// same-site form actions work without weakening origin checks globally.
			trustedOrigins: ['https://high-match-job-assistant.vercel.app']
		},
		adapter: adapter({
			runtime: 'nodejs22.x',
			maxDuration: 60
		})
	}
};

export default config;
