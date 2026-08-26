import type { ApplicationPacket, ApplicationRecord } from '$lib/types';
import { getDb } from './database';
import { runtimeFileExists } from './runtime-files';
import {
	audit,
	getApplicationForJob,
	getJob,
	getProfile,
	hashValue
} from './store';

function ensureApplication(jobId: number): ApplicationRecord {
	const existing = getApplicationForJob(jobId);
	if (existing) return existing;
	const now = new Date().toISOString();
	getDb()
		.prepare(`
			INSERT INTO applications (job_id, state, created_at, updated_at)
			VALUES (?, 'SHORTLISTED', ?, ?)
		`)
		.run(jobId, now, now);
	audit('application.shortlisted', 'job', jobId, {});
	const created = getApplicationForJob(jobId);
	if (!created) throw new Error('Could not create application.');
	return created;
}

export function shortlist(jobId: number): ApplicationRecord {
	if (!getJob(jobId)) throw new Error('Job not found.');
	return ensureApplication(jobId);
}

export function prepareApplication(jobId: number): ApplicationRecord {
	const job = getJob(jobId);
	if (!job) throw new Error('Job not found.');
	const profile = getProfile();
	const application = ensureApplication(jobId);
	const checklist: string[] = [];
	if (!profile.name) checklist.push('Add your legal name in Setup.');
	if (!profile.email) checklist.push('Add the email you want employers to use.');
	if (!profile.phone) checklist.push('Add a phone number for applications.');
	if (!profile.resumePath) checklist.push('Choose a resume file in Setup.');
	else if (!runtimeFileExists(profile.resumePath)) checklist.push('The configured resume file does not exist.');
	checklist.push('Review every generated statement against your resume.');
	checklist.push('Answer work authorization, salary expectations, legal attestations, and demographic questions yourself.');
	checklist.push('Confirm the employer domain and final form before submitting.');

	const contactReady = Boolean(
		profile.name && profile.email && profile.phone && profile.resumePath && runtimeFileExists(profile.resumePath)
	);
	const verifiedStrengths = job.match.strengths.filter((strength) => !strength.includes('compensation'));
	const skillSummary = job.match.matchedSkills.slice(0, 6).join(', ');
	const draftNote = skillSummary
		? `I am interested in the ${job.title} role at ${job.company}. My verified profile includes experience with ${skillSummary}, which overlaps with the work described in this posting. I would welcome the opportunity to discuss the role and should tailor this note before using it.`
		: `I am interested in the ${job.title} role at ${job.company}. I should add a role-specific note after reviewing the posting and my verified experience.`;
	const packet: ApplicationPacket = {
		jobId,
		createdAt: new Date().toISOString(),
		resumePath: profile.resumePath,
		contactReady,
		verifiedStrengths,
		gaps: job.match.gaps,
		unknowns: job.match.unknowns,
		checklist,
		draftNote
	};
	const packetHash = hashValue(packet);
	const state = contactReady ? 'READY_FOR_REVIEW' : 'NEEDS_INPUT';
	const now = new Date().toISOString();
	getDb().transaction(() => {
		getDb()
			.prepare(`
				UPDATE applications SET state = ?, packet_json = ?, packet_hash = ?, updated_at = ?
				WHERE id = ?
			`)
			.run(state, JSON.stringify(packet), packetHash, now, application.id);
		getDb().prepare('DELETE FROM approval_records WHERE application_id = ? AND consumed_at IS NULL').run(application.id);
	})();
	audit('application.prepared', 'application', application.id, { state, packetHash });
	const prepared = getApplicationForJob(jobId);
	if (!prepared) throw new Error('Could not prepare application.');
	return prepared;
}

export function approveAndConsumeForOpen(jobId: number): string {
	const job = getJob(jobId);
	const application = getApplicationForJob(jobId);
	if (!job || !application) throw new Error('Prepare the application first.');
	if (application.state !== 'READY_FOR_REVIEW' || !application.packetHash) {
		throw new Error('Resolve the application checklist and prepare it again before approval.');
	}
	const target = new URL(job.applyUrl);
	if (target.protocol !== 'https:') throw new Error('Application links must use HTTPS.');
	const approvedAt = new Date();
	const expiresAt = new Date(approvedAt.getTime() + 15 * 60 * 1000);
	const db = getDb();
	const result = db
		.prepare(`
			INSERT INTO approval_records (
				application_id, target_domain, packet_hash, approved_at, expires_at
			) VALUES (?, ?, ?, ?, ?)
		`)
		.run(application.id, target.hostname, application.packetHash, approvedAt.toISOString(), expiresAt.toISOString());
	const approvalId = Number(result.lastInsertRowid);
	db.transaction(() => {
		const approval = db
			.prepare('SELECT * FROM approval_records WHERE id = ? AND application_id = ?')
			.get(approvalId, application.id) as
			| { packet_hash: string; expires_at: string; consumed_at: string | null; target_domain: string }
			| undefined;
		if (
			!approval ||
			approval.consumed_at ||
			approval.packet_hash !== application.packetHash ||
			approval.target_domain !== target.hostname ||
			Date.parse(approval.expires_at) <= Date.now()
		) {
			throw new Error('Application approval is missing, changed, or expired.');
		}
		const now = new Date().toISOString();
		db.prepare('UPDATE approval_records SET consumed_at = ? WHERE id = ?').run(now, approvalId);
		db.prepare(`UPDATE applications SET state = 'OPENED', updated_at = ? WHERE id = ?`).run(now, application.id);
	})();
	audit('application.opened', 'application', application.id, {
		targetDomain: target.hostname,
		approvalId
	});
	return target.toString();
}

export function confirmSubmitted(jobId: number, confirmationId: string): void {
	const application = getApplicationForJob(jobId);
	if (!application || application.state !== 'OPENED') {
		throw new Error('Open the reviewed employer application before marking it submitted.');
	}
	const cleanConfirmation = confirmationId.trim().slice(0, 200);
	const now = new Date().toISOString();
	getDb()
		.prepare(`
			UPDATE applications SET state = 'SUBMITTED', confirmation_id = ?, updated_at = ?
			WHERE id = ?
		`)
		.run(cleanConfirmation || null, now, application.id);
	audit('application.submitted_confirmed', 'application', application.id, {
		hasConfirmationId: Boolean(cleanConfirmation)
	});
}
