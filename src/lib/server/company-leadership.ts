export const LEADERSHIP_RESEARCHED_AT = '2026-09-04';

export const SURNAME_CONTEXT =
	'Surname etymology describes a name\'s linguistic or geographic history. It is not evidence of a person\'s race, ethnicity, nationality, ancestry, or identity.';

const NO_LISTED_CTO = 'No current company-wide CTO is listed in the cited company source.';
const UNRESOLVED_ORIGIN = 'Origin not reliably resolved for this surname spelling.';

export interface LeadershipPerson {
	role: string;
	name: string;
	surname: string;
	surnameOrigin: string;
	leadershipUrl?: string;
	surnameReferenceUrl?: string;
}

export interface CompanyLeadership {
	company: string;
	companySourceUrl: string;
	people: LeadershipPerson[];
	technologyRoleNote?: string;
}

function surnameReference(surname: string): string {
	const slug = surname
		.normalize('NFKD')
		.replace(/[\u0300-\u036f]/g, '')
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-|-$/g, '');
	return `https://www.ancestry.com/last-name-meaning/${slug}`;
}

function person(
	role: string,
	name: string,
	surname: string,
	surnameOrigin: string,
	leadershipUrl?: string
): LeadershipPerson {
	return {
		role,
		name,
		surname,
		surnameOrigin,
		leadershipUrl,
		surnameReferenceUrl:
			surnameOrigin === UNRESOLVED_ORIGIN ? undefined : surnameReference(surname)
	};
}

function company(
	companyName: string,
	companySourceUrl: string,
	people: LeadershipPerson[],
	technologyRoleNote?: string
): CompanyLeadership {
	return { company: companyName, companySourceUrl, people, technologyRoleNote };
}

export const COMPANY_LEADERSHIP: CompanyLeadership[] = [
	company('Airbnb', 'https://investors.airbnb.com/governance/default.aspx', [
		person('CEO', 'Brian Chesky', 'Chesky', 'Czech and Ashkenazi Jewish surname traditions'),
		person(
			'CTO',
			'Ahmad Al-Dahle',
			'Al-Dahle',
			'Arabic surname tradition',
			'https://news.airbnb.com/airbnb-announces-ahmad-al-dahle-as-chief-technology-officer/'
		)
	]),
	company('Airtable', 'https://www.airtable.com/newsroom', [
		person('CEO', 'Howie Liu', 'Liu', 'Chinese romanized surname'),
		person('CTO', 'David Azose', 'Azose', UNRESOLVED_ORIGIN)
	]),
	company('Algolia', 'https://www.algolia.com/about/leadership/', [
		person('CEO', 'Stephen Lynch', 'Lynch', 'Irish surname tradition'),
		person('CTO & Chief Architect', 'Xavier Grand', 'Grand', 'French surname tradition')
	]),
	company('Amplitude', 'https://amplitude.com/company', [
		person('CEO', 'Spenser Skates', 'Skates', 'English surname; variant of Scates'),
		person('CTO', 'Curtis Liu', 'Liu', 'Chinese romanized surname')
	]),
	company(
		'Anduril',
		'https://www.anduril.com/news/ai-insight-forum-national-security',
		[person('CEO', 'Brian Schimpf', 'Schimpf', 'German surname tradition')],
		NO_LISTED_CTO
	),
	company('Anthropic', 'https://www.anthropic.com/news/rahul-patil-joins-anthropic', [
		person('CEO', 'Dario Amodei', 'Amodei', 'Italian patronymic surname'),
		person('CTO', 'Rahul Patil', 'Patil', 'South Asian surname tradition')
	]),
	company('Asana', 'https://asana.com/leadership', [
		person('CEO', 'Dan Rogers', 'Rogers', 'English patronymic surname'),
		person('CTO', 'Amritansh Raghav', 'Raghav', 'Sanskrit-derived surname')
	]),
	company(
		'Automattic',
		'https://automattic.com/press/',
		[person('Founder & CEO', 'Matt Mullenweg', 'Mullenweg', UNRESOLVED_ORIGIN)],
		NO_LISTED_CTO
	),
	company(
		'Block',
		'https://investors.block.xyz/governance/leadership/default.aspx',
		[
			person(
				'Block Head (principal executive officer)',
				'Jack Dorsey',
				'Dorsey',
				'English and Irish surname with Norman French roots'
			)
		],
		NO_LISTED_CTO
	),
	company('Brex', 'https://www.brex.com/authors', [
		person('CEO', 'Pedro Franceschi', 'Franceschi', 'Italian patronymic surname'),
		person(
			'CTO',
			'James Reggio',
			'Reggio',
			'Italian locational surname',
			'https://www.brex.com/journal/press/brex-launches-ai-native-accounting-api'
		)
	]),
	company(
		'Canonical',
		'https://canonical.com/company',
		[person('CEO', 'Mark Shuttleworth', 'Shuttleworth', 'English locational surname')],
		NO_LISTED_CTO
	),
	company('Chime', 'https://www.chime.com/about-us/', [
		person('CEO', 'Chris Britt', 'Britt', 'English surname tradition'),
		person('CTO', 'Jeff Currier', 'Currier', 'English occupational surname with French roots')
	]),
	company('CircleCI', 'https://circleci.com/about/', [
		person('CEO', 'Jim Rose', 'Rose', 'Multiple English, German, and Jewish surname traditions'),
		person('CTO', 'Rob Zuber', 'Zuber', 'German and Swiss German surname tradition')
	]),
	company('Cloudflare', 'https://www.cloudflare.com/press/press-kit/', [
		person('CEO', 'Matthew Prince', 'Prince', 'English status or nickname surname'),
		person('CTO', 'Dane Knecht', 'Knecht', 'German occupational surname')
	]),
	company('Cockroach Labs', 'https://www.cockroachlabs.com/about/', [
		person('CEO', 'Spencer Kimball', 'Kimball', 'English surname tradition'),
		person('CTO & CPO', 'Peter Mattis', 'Mattis', 'German patronymic surname tradition')
	]),
	company('Coinbase', 'https://www.coinbase.com/about', [
		person('CEO', 'Brian Armstrong', 'Armstrong', 'English and Scottish nickname surname'),
		person('CTO', 'Rob Witoff', 'Witoff', 'German surname tradition')
	]),
	company('CoreWeave', 'https://investors.coreweave.com/governance/executive-management/default.aspx', [
		person('CEO', 'Mike Intrator', 'Intrator', UNRESOLVED_ORIGIN),
		person('CTO', 'Peter Salanki', 'Salanki', 'Hungarian locational surname tradition')
	]),
	company('Databricks', 'https://www.databricks.com/dataaisummit/session/wednesday-keynote', [
		person('CEO', 'Ali Ghodsi', 'Ghodsi', 'Persian surname tradition'),
		person('CTO', 'Matei Zaharia', 'Zaharia', 'Romanian surname tradition')
	]),
	company('Datadog', 'https://www.datadoghq.com/about/leadership/', [
		person('CEO', 'Olivier Pomel', 'Pomel', 'French surname tradition'),
		person('CTO', 'Alexis Lê-Quôc', 'Lê-Quôc', 'Vietnamese compound surname tradition')
	]),
	company('DigitalOcean', 'https://www.digitalocean.com/leadership/executive-management', [
		person('CEO', 'Paddy Srinivasan', 'Srinivasan', 'Sanskrit-derived South Indian patronymic'),
		person('Chief Product and Technology Officer', 'Vinay Kumar', 'Kumar', 'Sanskrit-derived surname')
	]),
	company('Discord', 'https://discord.com/press-releases/discord-appoints-new-ceo-humam-sakhnini', [
		person('CEO', 'Humam Sakhnini', 'Sakhnini', 'Arabic locational surname'),
		person('CTO', 'Stan Vishnevskiy', 'Vishnevskiy', 'East Slavic surname tradition')
	]),
	company(
		'DoorDash',
		'https://ir.doordash.com/governance/management/default.aspx',
		[person('CEO', 'Tony Xu', 'Xu', 'Chinese romanized surname')],
		NO_LISTED_CTO
	),
	company('Dropbox', 'https://www.dropbox.com/about', [
		person('Co-CEO', 'Drew Houston', 'Houston', 'Scottish locational surname'),
		person('Co-CEO', 'Ashraf Alkarmi', 'Alkarmi', 'Arabic surname tradition'),
		person('CTO', 'Ali Dasdan', 'Dasdan', 'Turkish surname tradition')
	]),
	company(
		'Duolingo',
		'https://investors.duolingo.com/governance/',
		[person('CEO', 'Luis von Ahn', 'von Ahn', 'German surname tradition')],
		NO_LISTED_CTO
	),
	company('Elastic', 'https://www.elastic.co/about/leadership', [
		person('CEO', 'Ashutosh Kulkarni', 'Kulkarni', 'South Asian occupational surname'),
		person('CTO', 'Shay Banon', 'Banon', UNRESOLVED_ORIGIN)
	]),
	company('Fastly', 'https://www.fastly.com/company', [
		person('CEO', 'Kip Compton', 'Compton', 'English locational surname'),
		person('CTO', 'Artur Bergman', 'Bergman', 'German, Swedish, and Jewish surname traditions')
	]),
	company('Figma', 'https://investor.figma.com/governance/executive-management/default.aspx', [
		person('CEO', 'Dylan Field', 'Field', 'English topographic surname'),
		person('CTO', 'Kris Rasmussen', 'Rasmussen', 'Danish and Norwegian patronymic surname')
	]),
	company('Flexport', 'https://www.flexport.com/blog/setting-technology-strategy-2020-and-beyond-flexport-welcomes-new-cto-james/', [
		person('CEO', 'Ryan Petersen', 'Petersen', 'Danish and Norwegian patronymic surname'),
		person('CTO', 'James Chen', 'Chen', 'Chinese romanized surname')
	]),
	company('GitLab', 'https://about.gitlab.com/company/team/e-group/', [
		person('CEO', 'Bill Staples', 'Staples', 'English surname tradition'),
		person('CTO', 'Siva Padisetty', 'Padisetty', 'South Asian surname tradition')
	]),
	company('Glean', 'https://www.glean.com/about', [
		person('CEO', 'Arvind Jain', 'Jain', "South Asian surname derived from Sanskrit jina ('victor')"),
		person('CTO', 'T. R. Vishwanath', 'Vishwanath', 'Sanskrit-derived surname')
	]),
	company('Grafana Labs', 'https://grafana.com/about/team/', [
		person('CEO', 'Raj Dutt', 'Dutt', 'South Asian surname tradition'),
		person('CTO', 'Tom Wilkie', 'Wilkie', 'Scottish surname tradition')
	]),
	company('Honeycomb', 'https://www.honeycomb.io/blog/next-era-of-observability-founders-reflections-additional-q-and-a', [
		person('CEO', 'Christine Yen', 'Yen', 'Multiple Chinese and Vietnamese romanized surname traditions'),
		person('CTO', 'Charity Majors', 'Majors', 'English surname tradition')
	]),
	company('Instacart', 'https://company.instacart.com/about-us', [
		person('CEO', 'Chris Rogers', 'Rogers', 'English patronymic surname'),
		person('CTO', 'Anirban Kundu', 'Kundu', 'Bengali-language surname tradition')
	]),
	company('LaunchDarkly', 'https://launchdarkly.com/blog/speed-isnt-the-risk-lack-of-control-is/', [
		person('CEO', 'Edith Harbaugh', 'Harbaugh', UNRESOLVED_ORIGIN),
		person('CTO', 'Cameron Etezadi', 'Etezadi', 'Persian surname tradition')
	]),
	company('Lyft', 'https://www.lyft.com/blog/posts/welcoming-senthil-padmanabhan-chief-technology-officer', [
		person('CEO', 'David Risher', 'Risher', UNRESOLVED_ORIGIN),
		person('CTO', 'Senthil Padmanabhan', 'Padmanabhan', 'Sanskrit-derived South Indian patronymic')
	]),
	company('MongoDB', 'https://www.mongodb.com/company/leadership', [
		person('CEO', 'Chirantan Desai', 'Desai', 'South Asian occupational surname'),
		person('CTO', 'Jim Scharf', 'Scharf', 'German nickname surname')
	]),
	company('Netlify', 'https://www.netlify.com/about/', [
		person('CEO', 'Mathias Biilmann', 'Biilmann', 'Danish surname tradition'),
		person(
			'CTO',
			'Dana Lawson',
			'Lawson',
			'English and Scottish patronymic surname',
			'https://www.netlify.com/blog/netlify-source-with-netlify-cto-dana-lawson/'
		)
	]),
	company('New Relic', 'https://newrelic.com/about/leadership', [
		person('CEO', 'Ashan Willy', 'Willy', 'English surname tradition'),
		person('CTO', 'Michael Frendo', 'Frendo', 'Maltese surname tradition')
	]),
	company(
		'Okta',
		'https://www.okta.com/company/leadership/',
		[person('CEO', 'Todd McKinnon', 'McKinnon', 'Scottish Gaelic patronymic surname')],
		NO_LISTED_CTO
	),
	company('PagerDuty', 'https://www.pagerduty.com/leadership/', [
		person('CEO', 'John DiLullo', 'DiLullo', 'Italian surname tradition'),
		person('CTO', 'Tim Armandpour', 'Armandpour', UNRESOLVED_ORIGIN)
	]),
	company('Pinterest', 'https://newsroom.pinterest.com/company/leadership/', [
		person('CEO', 'Bill Ready', 'Ready', 'English surname tradition'),
		person('Chief Product and Technology Officer', 'Matt Madrigal', 'Madrigal', 'Spanish locational surname')
	]),
	company(
		'PlanetScale',
		'https://planetscale.com/blog/new-ceo-of-planetscale',
		[person('CEO', 'Sam Lambert', 'Lambert', 'French, English, and Germanic surname traditions')],
		NO_LISTED_CTO
	),
	company('Postman', 'https://www.postman.com/company/press-media/', [
		person('CEO', 'Abhinav Asthana', 'Asthana', 'South Asian locational surname'),
		person('Co-founder and Field CTO', 'Ankit Sobti', 'Sobti', 'South Asian surname tradition')
	]),
	company(
		'Reddit',
		'https://redditinc.com/news/announcing-new-executive-leadership-updates-at-reddit',
		[person('CEO', 'Steve Huffman', 'Huffman', 'German occupational surname')],
		NO_LISTED_CTO
	),
	company('Remote', 'https://remote.com/about', [
		person('CEO & Co-founder', 'Job van der Voort', 'van der Voort', 'Dutch topographic surname'),
		person('CTO', 'Sofia Silva', 'Silva', 'Portuguese surname tradition')
	]),
	company(
		'Roblox',
		'https://about.roblox.com/leadership',
		[person('CEO', 'David Baszucki', 'Baszucki', 'Polish surname tradition')],
		NO_LISTED_CTO
	),
	company('Rubrik', 'https://www.rubrik.com/company/about/leadership', [
		person('CEO', 'Bipul Sinha', 'Sinha', 'Sanskrit-derived South Asian surname'),
		person('CTO', 'Arvind Nithrakashyap', 'Nithrakashyap', 'Sanskrit-derived compound surname')
	]),
	company('Samsara', 'https://investors.samsara.com/governance/executive-management/default.aspx', [
		person('CEO', 'Sanjit Biswas', 'Biswas', 'Bengali-language honorific surname'),
		person('CTO', 'John Bicket', 'Bicket', UNRESOLVED_ORIGIN)
	]),
	company(
		'Scale AI',
		'https://scale.com/blog/scale-appoints-new-ceo',
		[person('CEO', 'Francis deSouza', 'deSouza', 'Portuguese surname tradition')],
		NO_LISTED_CTO
	),
	company(
		'Sourcegraph',
		'https://sourcegraph.com/about',
		[person('CEO', 'Dan Adler', 'Adler', "German and Jewish surname meaning 'eagle'")],
		NO_LISTED_CTO
	),
	company('Stripe', 'https://stripe.com/sessions', [
		person('CEO', 'Patrick Collison', 'Collison', 'Irish patronymic surname'),
		person('CTO', 'David Singleton', 'Singleton', 'English locational surname')
	]),
	company('Sumo Logic', 'https://www.sumologic.com/company/leadership', [
		person('CEO', 'Chris Malone', 'Malone', 'Irish patronymic surname'),
		person('Chief Product & Technology Officer', 'Keith Kuchler', 'Kuchler', 'German occupational surname')
	]),
	company('Tailscale', 'https://tailscale.com/company', [
		person('CEO', 'Avery Pennarun', 'Pennarun', 'Breton surname tradition'),
		person('CTO', 'David Crawshaw', 'Crawshaw', 'English locational surname')
	]),
	company('Together AI', 'https://www.together.ai/about-us', [
		person('CEO', 'Vipul Ved Prakash', 'Prakash', "Sanskrit-derived surname meaning 'light'"),
		person('CTO', 'Ce Zhang', 'Zhang', 'Chinese romanized surname')
	]),
	company('Twilio', 'https://www.twilio.com/en-us/company/leadership', [
		person('CEO', 'Khozema Shipchandler', 'Shipchandler', 'English occupational compound surname'),
		person('Chief Product & Technology Officer', 'Inbal Shani', 'Shani', 'Hebrew surname tradition')
	]),
	company('Vercel', 'https://vercel.com/blog/vercel-ship-2026-recap', [
		person('CEO', 'Guillermo Rauch', 'Rauch', 'German surname tradition'),
		person('CTO', 'Malte Ubl', 'Ubl', 'German surname tradition')
	]),
	company('Verkada', 'https://www.verkada.com/about/', [
		person('CEO', 'Filip Kaliszan', 'Kaliszan', 'Polish surname tradition'),
		person('CTO', 'Martin Hunt', 'Hunt', 'English occupational surname')
	]),
	company(
		'Webflow',
		'https://webflow.com/blog/announcing-new-ceo-linda-tong',
		[person('CEO', 'Linda Tong', 'Tong', 'Multiple Chinese romanized surname traditions')],
		NO_LISTED_CTO
	),
	company(
		'Anyscale',
		'https://www.anyscale.com/about',
		[person('CEO', 'Robert Nishihara', 'Nishihara', 'Japanese locational surname')],
		NO_LISTED_CTO
	),
	company('Baseten', 'https://www.baseten.co/about-us/', [
		person('CEO', 'Tuhin Srivastava', 'Srivastava', 'Sanskrit-derived South Asian surname'),
		person('CTO', 'Amir Haghighat', 'Haghighat', 'Persian surname tradition')
	]),
	company('Cerebras', 'https://www.cerebras.ai/company', [
		person('CEO', 'Andrew Feldman', 'Feldman', 'German and Jewish occupational surname'),
		person('CTO', 'Sean Lie', 'Lie', 'Multiple Norwegian, Chinese, and Indonesian surname traditions')
	]),
	company('Character.AI', 'https://blog.character.ai/character-ai-names-karandeep-anand-as-ceo/', [
		person('CEO', 'Karandeep Anand', 'Anand', "Sanskrit-derived surname meaning 'joy'"),
		person(
			'CTO',
			'Sunita Verma',
			'Verma',
			'Sanskrit-derived surname',
			'https://blog.character.ai/meet-the-team-character-ai-welcomes-sunita-verma-as-chief-technology-officer/'
		)
	]),
	company('Cohere', 'https://cohere.com/about', [
		person('CEO', 'Aidan Gomez', 'Gomez', 'Spanish patronymic surname'),
		person('CTO', 'Phil Blunsom', 'Blunsom', 'English surname tradition')
	]),
	company('Crusoe', 'https://crusoe.ai/leadership', [
		person('CEO', 'Chase Lochmiller', 'Lochmiller', 'German compound surname tradition'),
		person('CTO', 'Nitin Perumbeti', 'Perumbeti', 'South Asian locational surname tradition')
	]),
	company(
		'Cursor',
		'https://cursor.com/compile',
		[person('CEO', 'Michael Truell', 'Truell', UNRESOLVED_ORIGIN)],
		NO_LISTED_CTO
	),
	company(
		'Decagon',
		'https://decagon.ai/about',
		[person('CEO', 'Jesse Zhang', 'Zhang', 'Chinese romanized surname')],
		NO_LISTED_CTO
	),
	company('E2B', 'https://e2b.dev/blog/series-a', [
		person('CEO', 'Vasek Mlejnsky', 'Mlejnsky', 'Czech surname tradition'),
		person('CTO', 'Tomas Valenta', 'Valenta', 'Czech and Slovak surname tradition')
	]),
	company('ElevenLabs', 'https://elevenlabs.io/about', [
		person('CEO', 'Mati Staniszewski', 'Staniszewski', 'Polish patronymic surname'),
		person('CTO', 'Piotr Dabkowski', 'Dabkowski', 'Polish surname tradition')
	]),
	company(
		'Fireworks AI',
		'https://fireworks.ai/team',
		[person('CEO', 'Lin Qiao', 'Qiao', 'Chinese romanized surname')],
		NO_LISTED_CTO
	),
	company('Harvey', 'https://www.harvey.ai/blog/harvey-to-expand-team-with-new-toronto-office', [
		person('CEO', 'Winston Weinberg', 'Weinberg', 'German and Jewish ornamental surname'),
		person('CTO', 'Siva Gurumurthy', 'Gurumurthy', 'Sanskrit-derived South Indian surname')
	]),
	company('Lambda', 'https://lambda.ai/leadership', [
		person('CEO', 'Michel Combes', 'Combes', 'French surname tradition'),
		person('CTO', 'Stephen Balaban', 'Balaban', 'Multiple Eastern European surname traditions')
	]),
	company(
		'LangChain',
		'https://www.langchain.com/about',
		[person('CEO', 'Harrison Chase', 'Chase', 'English occupational surname')],
		NO_LISTED_CTO
	),
	company('Linear', 'https://linear.app/about', [
		person('CEO', 'Karri Saarinen', 'Saarinen', 'Finnish surname tradition'),
		person('CTO', 'Tuomas Artman', 'Artman', UNRESOLVED_ORIGIN)
	]),
	company(
		'LlamaIndex',
		'https://www.llamaindex.ai/about',
		[person('CEO', 'Jerry Liu', 'Liu', 'Chinese romanized surname')],
		NO_LISTED_CTO
	),
	company('Modal', 'https://modal.com/company', [
		person('CEO', 'Erik Bernhardsson', 'Bernhardsson', 'Swedish patronymic surname'),
		person('CTO', 'Akshat Bubna', 'Bubna', 'South Asian surname tradition')
	]),
	company(
		'MotherDuck',
		'https://motherduck.com/about-us/',
		[person('CEO', 'Jordan Tigani', 'Tigani', UNRESOLVED_ORIGIN)],
		NO_LISTED_CTO
	),
	company('Notion', 'https://www.notion.com/blog/notion-new-cto', [
		person('CEO', 'Ivan Zhao', 'Zhao', 'Chinese romanized surname'),
		person('CTO', 'Fuzzy Khosrowshahi', 'Khosrowshahi', 'Persian surname tradition')
	]),
	company(
		'OpenAI',
		'https://openai.com/our-structure/',
		[person('CEO', 'Sam Altman', 'Altman', 'German and Jewish surname traditions')],
		'No current company-wide CTO is listed. OpenAI separately lists a CTO of Applications, a scoped role.'
	),
	company('Perplexity', 'https://www.perplexity.ai', [
		person('CEO', 'Aravind Srinivas', 'Srinivas', 'Sanskrit-derived South Indian patronymic'),
		person('CTO', 'Denis Yarats', 'Yarats', 'East Slavic surname tradition')
	]),
	company('Pika', 'https://pika.art/about', [
		person('CEO', 'Demi Guo', 'Guo', 'Chinese romanized surname'),
		person('CTO', 'Chenlin Meng', 'Meng', 'Chinese romanized surname')
	]),
	company(
		'Pinecone',
		'https://www.pinecone.io/company/',
		[person('CEO', 'Ash Ashutosh', 'Ashutosh', 'Sanskrit-derived name')],
		NO_LISTED_CTO
	),
	company('Prime Intellect', 'https://www.primeintellect.ai', [
		person('CEO', 'Vincent Weisser', 'Weisser', 'German nickname surname'),
		person('CTO', 'Johannes Hagemann', 'Hagemann', 'German surname tradition')
	]),
	company(
		'Railway',
		'https://railway.com/about',
		[person('CEO', 'Jake Cooper', 'Cooper', 'English occupational surname')],
		NO_LISTED_CTO
	),
	company('Ramp', 'https://ramp.com/blog/welcoming-my-co-founder-karim-as-co-ceo-of-ramp', [
		person('Co-CEO', 'Eric Glyman', 'Glyman', UNRESOLVED_ORIGIN),
		person('Co-CEO', 'Karim Atiyeh', 'Atiyeh', 'Arabic surname tradition'),
		person('CTO', 'Rahul Sengottuvelu', 'Sengottuvelu', 'Tamil-language surname tradition')
	]),
	company(
		'Render',
		'https://render.com/about',
		[person('CEO', 'Anurag Goel', 'Goel', 'South Asian surname; spelling variant of Goyal')],
		NO_LISTED_CTO
	),
	company('Replit', 'https://replit.com/about', [
		person('CEO', 'Amjad Masad', 'Masad', 'Arabic surname tradition'),
		person('CTO', 'Luis Héctor Chávez', 'Chávez', 'Spanish patronymic surname')
	]),
	company('Retell AI', 'https://www.retellai.com/about-us', [
		person('CEO', 'Bing Wu', 'Wu', 'Chinese romanized surname'),
		person('CTO', 'Zexia Zhang', 'Zhang', 'Chinese romanized surname')
	]),
	company('Runway', 'https://runway.com/news/new-leaders-to-support-next-phase-of-growth', [
		person('Co-CEO', 'Cristóbal Valenzuela', 'Valenzuela', 'Spanish locational surname'),
		person('Co-CEO', 'Anastasis Germanidis', 'Germanidis', 'Greek patronymic surname'),
		person('CTO', 'Kamil Sindi', 'Sindi', 'Arabic locational surname tradition')
	]),
	company(
		'Sierra',
		'https://sierra.ai/about',
		[person('CEO', 'Bret Taylor', 'Taylor', 'English occupational surname')],
		NO_LISTED_CTO
	),
	company('Supabase', 'https://supabase.com/blog/authors/paul_copplestone', [
		person('CEO', 'Paul Copplestone', 'Copplestone', 'English locational surname'),
		person(
			'CTO',
			'Ant Wilson',
			'Wilson',
			'English and Scottish patronymic surname',
			'https://supabase.com/blog/authors/ant_wilson'
		)
	]),
	company('Temporal', 'https://temporal.io/about', [
		person('CEO', 'Samar Abbas', 'Abbas', 'Arabic patronymic surname'),
		person('CTO', 'Maxim Fateev', 'Fateev', 'East Slavic patronymic surname')
	]),
	company('Zapier', 'https://zapier.com/press', [
		person('CEO', 'Wade Foster', 'Foster', 'English occupational surname'),
		person(
			'CTO',
			'Bryan Helmig',
			'Helmig',
			'German surname tradition',
			'https://zapier.com/blog/author/bryan-helmig/'
		)
	]),
	company('Palantir', 'https://investors.palantir.com/management.html', [
		person('CEO', 'Alexander Karp', 'Karp', 'German and Jewish surname traditions'),
		person('CTO', 'Shyam Sankar', 'Sankar', 'Sanskrit-derived South Asian surname')
	]),
	company(
		'Spotify',
		'https://newsroom.spotify.com/2025-09-30/spotify-announcement-daniel-ek-executive-chairman/',
		[
			person('Co-CEO', 'Alex Norström', 'Norström', 'Swedish ornamental surname'),
			person('Co-CEO', 'Gustav Söderström', 'Söderström', 'Swedish ornamental surname')
		],
		NO_LISTED_CTO
	)
];

const leadershipByCompany = new Map(COMPANY_LEADERSHIP.map((entry) => [entry.company, entry]));

export function getCompanyLeadership(companyName: string): CompanyLeadership | null {
	return leadershipByCompany.get(companyName) ?? null;
}
