# Job Assistant

A private, local-first dashboard that finds jobs from public employer ATS feeds, ranks them against your preferences, explains the match, surfaces compensation evidence, and prepares a review-gated application handoff.

[Try the live demo](https://high-match-job-assistant.vercel.app)

The public Vercel deployment is a disposable discovery demo. It never accepts profile, resume, or application-tracking data; clone and run the project locally for the private, durable workflow.

## What works in the MVP

- Sync public Greenhouse, Ashby, and Lever company boards without scraping or login credentials.
- Rank jobs with explainable title, skill, seniority, location, and compensation components.
- Show employer-posted salary ranges when provided and clearly label a broad BLS benchmark when pay is missing.
- Shortlist or dismiss jobs and generate an application review packet from verified profile facts.
- Record explicit approval, then open the canonical employer application form for your final review and submission.
- Keep SQLite data and application material outside the repository.

The MVP intentionally does **not** automate LinkedIn or Indeed and never performs the final submit click. Cross-employer applicant submission APIs do not exist; ATS submission APIs require employer credentials. Browser-assisted autofill can be added later, one allowlisted ATS at a time, while preserving the final approval gate.

## Run it

Requirements: Node.js 22+ and npm.

```sh
npm install
npm run dev
```

Open `http://127.0.0.1:5173`, review the profile under **Setup**, then choose **Sync jobs**. The default sources are relevant AI infrastructure employers using public ATS feeds; they can be enabled or disabled under **Sources**.

Production-style local run:

```sh
npm run build
npm start
```

## Private data location

- Linux/WSL: `$XDG_DATA_HOME/job-assistant`, or `~/.local/share/job-assistant`
- Windows: `%LOCALAPPDATA%\JobAssistant`

Set `JOB_ASSISTANT_DATA_DIR` in `.env.local` only if you need a custom location. The app rejects a data directory inside the Git checkout.

## Vercel demo mode

Vercel deployments automatically use a temporary SQLite database under `/tmp` and disable profile editing, shortlisting, application packets, and submission tracking. Synced jobs can reset between requests or function instances. This makes the hosted site safe as a public product demo, not a durable personal assistant.

A durable hosted version needs authenticated per-user access, hosted SQL storage, and private resume-file storage. The local version remains the complete MVP.

## Data-source policy

The built-in connectors use official public job-posting APIs:

- [Greenhouse Job Board API](https://developer.greenhouse.io/job-board.html)
- [Ashby public Job Postings API](https://developers.ashbyhq.com/docs/public-job-posting-api)
- [Lever Postings API](https://github.com/lever/postings-api)

Compensation evidence is prioritized as employer-posted range first. When a software role has no disclosed pay, the UI may show the May 2025 U.S. BLS OEWS software-developer median as a broad national benchmark—not as the employer's range. See the [BLS OEWS tables](https://www.bls.gov/oes/tables.htm).

Optional CareerOneStop and USAJOBS connectors are planned once their API credentials are configured.

## Validate

```sh
npm run ci
```

Read [PRIVACY.md](PRIVACY.md) before adding contact details or application answers.

## License

[MIT](LICENSE)
