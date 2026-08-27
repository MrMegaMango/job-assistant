import adapter from '@sveltejs/adapter-vercel';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		csp: {
			mode: 'nonce',
			directives: {
				'default-src': ['self'],
				'script-src': ['self'],
				'style-src': ['self', 'unsafe-inline'],
				'img-src': ['self', 'data:'],
				'connect-src': ['self'],
				'object-src': ['none'],
				'base-uri': ['self'],
				'form-action': ['self'],
				'frame-ancestors': ['none']
			}
		},
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
