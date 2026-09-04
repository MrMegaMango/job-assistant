import type { SourceProvider } from '$lib/types';

export const SOURCE_POLICY_URLS: Record<SourceProvider, string> = {
	greenhouse: 'https://developer.greenhouse.io/job-board.html',
	ashby: 'https://developers.ashbyhq.com/docs/public-job-posting-api',
	lever: 'https://github.com/lever/postings-api'
};

export interface CatalogSource {
	provider: SourceProvider;
	name: string;
	boardToken: string;
	policyUrl: string;
}

function catalog(
	provider: SourceProvider,
	companies: ReadonlyArray<readonly [name: string, boardToken: string]>
): CatalogSource[] {
	return companies.map(([name, boardToken]) => ({
		provider,
		name,
		boardToken,
		policyUrl: SOURCE_POLICY_URLS[provider]
	}));
}

// Keep this catalog to boards verified against the provider's public posting API.
// INSERT OR IGNORE migrations add new entries without re-enabling boards a user paused.
export const DEFAULT_SOURCES: CatalogSource[] = [
	...catalog('greenhouse', [
		['Airbnb', 'airbnb'],
		['Airtable', 'airtable'],
		['Algolia', 'algolia'],
		['Amplitude', 'amplitude'],
		['Anduril', 'andurilindustries'],
		['Anthropic', 'anthropic'],
		['Asana', 'asana'],
		['Block', 'block'],
		['Brex', 'brex'],
		['Canonical', 'canonical'],
		['Chime', 'chime'],
		['CircleCI', 'circleci'],
		['Cloudflare', 'cloudflare'],
		['Cockroach Labs', 'cockroachlabs'],
		['Coinbase', 'coinbase'],
		['CoreWeave', 'coreweave'],
		['Databricks', 'databricks'],
		['Datadog', 'datadog'],
		['DigitalOcean', 'digitalocean98'],
		['Discord', 'discord'],
		['DoorDash', 'doordashusa'],
		['Dropbox', 'dropbox'],
		['Duolingo', 'duolingo'],
		['Elastic', 'elastic'],
		['Fastly', 'fastly'],
		['Figma', 'figma'],
		['Flexport', 'flexport'],
		['GitLab', 'gitlab'],
		['Glean', 'gleanwork'],
		['Grafana Labs', 'grafanalabs'],
		['Honeycomb', 'honeycomb'],
		['Instacart', 'instacart'],
		['LaunchDarkly', 'launchdarkly'],
		['Lyft', 'lyft'],
		['MongoDB', 'mongodb'],
		['Netlify', 'netlify'],
		['New Relic', 'newrelic'],
		['Okta', 'okta'],
		['PagerDuty', 'pagerduty'],
		['Pinterest', 'pinterest'],
		['PlanetScale', 'planetscale'],
		['Postman', 'postman'],
		['Reddit', 'reddit'],
		['Roblox', 'roblox'],
		['Rubrik', 'rubrik'],
		['Samsara', 'samsara'],
		['Scale AI', 'scaleai'],
		['Sourcegraph', 'sourcegraph91'],
		['Stripe', 'stripe'],
		['Sumo Logic', 'sumologic'],
		['Tailscale', 'tailscale'],
		['Together AI', 'togetherai'],
		['Twilio', 'twilio'],
		['Vercel', 'vercel'],
		['Verkada', 'verkada'],
		['Webflow', 'webflow']
	]),
	...catalog('ashby', [
		['Anyscale', 'anyscale'],
		['Baseten', 'baseten'],
		['Cerebras', 'cerebras'],
		['Character.AI', 'character'],
		['Cohere', 'cohere'],
		['Crusoe', 'crusoe'],
		['Cursor', 'cursor'],
		['Decagon', 'decagon'],
		['E2B', 'e2b'],
		['ElevenLabs', 'elevenlabs'],
		['Fireworks AI', 'fireworks'],
		['Harvey', 'harvey'],
		['Lambda', 'lambda'],
		['LangChain', 'langchain'],
		['Linear', 'linear'],
		['LlamaIndex', 'llamaindex'],
		['Modal', 'modal'],
		['MotherDuck', 'motherduck'],
		['Notion', 'notion'],
		['OpenAI', 'openai'],
		['Perplexity', 'perplexity'],
		['Pika', 'pika'],
		['Pinecone', 'pinecone'],
		['Prime Intellect', 'primeintellect'],
		['Railway', 'railway'],
		['Ramp', 'ramp'],
		['Render', 'render'],
		['Replit', 'replit'],
		['Retell AI', 'retell-ai'],
		['Runway', 'runway-ml'],
		['Sierra', 'sierra'],
		['Supabase', 'supabase'],
		['Temporal', 'temporal'],
		['Zapier', 'zapier']
	]),
	...catalog('lever', [
		['Palantir', 'palantir'],
		['Spotify', 'spotify']
	])
];
