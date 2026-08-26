# Privacy and action boundaries

High Match Job Assistant stores its SQLite database outside the Git checkout. On Linux and WSL the default is `~/.local/share/job-assistant`; on Windows it uses `%LOCALAPPDATA%\JobAssistant`.

On Vercel, the app runs only as a disposable public demo. Its temporary database lives under `/tmp`, may reset at any time, and the server rejects profile and application-state changes. Public pages receive only non-identifying matching criteria; identity, contact, resume, salary-floor, exclusion, and application fields are not serialized. Do not enter personal data into a hosted demo or remove those guards without first adding authentication and durable private storage.

The build constrains dependency tracing to the repository and audits generated Vercel output. It fails closed if a traced path resolves outside the checkout or if the output contains a credential, local database, resume, application packet, or external home-directory path.

The database can contain a resume path, contact details, preferences, generated application notes, and an audit trail. Protect the host account and disk. Do not copy the database, `.env.local`, browser profiles, or generated packets into Git, issues, logs, screenshots, or support chats.

The MVP reads public employer job feeds and never logs in to job boards. It does not scrape LinkedIn or Indeed. Application preparation is local. The app records an approval before sending you to the canonical employer application page, but you review the form and perform the final submission yourself.

Job descriptions are treated as untrusted text. They are normalized for display and matching, never executed, and never granted tool access.
