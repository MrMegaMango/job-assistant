# Privacy and action boundaries

High Match Job Assistant stores its SQLite database outside the Git checkout. On Linux and WSL the default is `~/.local/share/job-assistant`; on Windows it uses `%LOCALAPPDATA%\JobAssistant`.

On Vercel, the job cache remains a disposable preview of the personal local workflow. Its temporary database lives under `/tmp` and may reset at any time. Visitors may switch among built-in anonymous professional profiles; the chosen profile ID is stored in an HTTP-only, same-site browser cookie.

Optional Google sign-in creates private, named matching profiles in Supabase Postgres. Row-level-security policies restrict reads and writes to the authenticated user ID. Each matching-profile record contains a short user-chosen label, target titles, verified skills, focus areas, location preference, salary floor, and exclusion keywords. It does not contain a legal name, email address, phone number, resume, application answers, application state, or Google provider tokens. Supabase and Google separately maintain the account identity needed for authentication under their respective policies.

Hosted identity, contact, resume, shortlisting, application-packet, and submission-tracking features remain disabled. Do not enter those details into the hosted matching fields.

The build constrains dependency tracing to the repository and audits generated Vercel output. It fails closed if a traced path resolves outside the checkout or if the output contains a credential, local database, resume, application packet, or external home-directory path.

The database can contain a resume path, contact details, preferences, generated application notes, and an audit trail. Protect the host account and disk. Do not copy the database, `.env.local`, browser profiles, or generated packets into Git, issues, logs, screenshots, or support chats.

The MVP reads public employer job feeds and never logs in to job boards. It does not scrape LinkedIn or Indeed. Application preparation is local. The app records an approval before sending you to the canonical employer application page, but you review the form and perform the final submission yourself.

Job descriptions are treated as untrusted text. They are normalized for display and matching, never executed, and never granted tool access.
