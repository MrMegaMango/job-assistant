# High Match Job Assistant

A private, local-first dashboard built first for one person's real job search. It finds jobs from public employer ATS feeds, ranks them against verified experience, explains the match, surfaces compensation evidence, and prepares a review-gated application handoff.

The complete product is the durable local workflow: personal preferences and application history stay on the user's machine, and the ranking is tuned to that user's actual goals. A constrained hosted preview exists to show the matching experience without accepting private data.

## What works in the MVP

- Sync more than 90 validated public Greenhouse, Ashby, and Lever company boards without scraping or login credentials.
- Rank jobs with explainable title, verified-skill, domain-focus, seniority, location, and compensation components.
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

Open `http://127.0.0.1:5173`, review the profile under **Setup**, then choose **Sync jobs**. More than 90 validated public boards are enabled by default across AI labs, infrastructure, developer tools, security, fintech, and large technology employers. They can be enabled or disabled under **Sources**, and additional Greenhouse, Ashby, or Lever board URLs can be pasted directly without changing code.

Preview the production build locally:

```sh
npm run build
npm start
```

## Private data location

- Linux/WSL: `$XDG_DATA_HOME/job-assistant`, or `~/.local/share/job-assistant`
- Windows: `%LOCALAPPDATA%\JobAssistant`

Set `JOB_ASSISTANT_DATA_DIR` in `.env.local` only if you need a custom location. The app rejects a data directory inside the Git checkout.

## Optional hosted preview

[View the hosted preview](https://high-match-job-assistant.vercel.app). It is a secondary, read-only view of the matching experience; the local app remains the product's focus.

Vercel deployments automatically use a temporary SQLite database under `/tmp` and disable profile editing, shortlisting, application packets, and submission tracking. The hosted profile contains professional matching criteria only; contact and resume fields are blank. Synced jobs can reset between requests or function instances; cold briefing and job-detail requests refresh their temporary job data when needed. This keeps the preview separate from the durable personal assistant.

The production build constrains Vercel's dependency trace to the repository and then audits the generated bundle. The build fails and removes its output if it finds an external home-directory path, local database, credential file, resume, or application packet.

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
