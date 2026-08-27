import { createHash } from 'node:crypto';
export const severities = ['minor', 'major', 'blocker'];
export const statuses = ['open', 'resolved'];
export const sources = ['live', 'session-review'];
export function normalizeMessage(message) {
    return message
        .normalize('NFKC')
        .toLowerCase()
        .replace(/[^\p{L}\p{N}]+/gu, ' ')
        .trim()
        .replace(/\s+/g, ' ');
}
export function fingerprintFor(repo, message) {
    const normalizedMessage = normalizeMessage(message);
    const fingerprintMessage = normalizedMessage || message.normalize('NFKC').toLowerCase().trim();
    return createHash('sha256')
        .update(`${repo ?? ''}\n${fingerprintMessage}`)
        .digest('hex');
}
