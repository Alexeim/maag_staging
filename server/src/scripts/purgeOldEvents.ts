/**
 * Permanently delete events that have been over long enough.
 *
 * Usage (run from server/):
 *   npm run purge:events:dry      # list what WOULD be deleted, touch nothing
 *   npm run purge:events:apply    # actually delete
 *
 * Grace period (days after an event ends before it may be deleted) defaults to
 * 90 and can be overridden:
 *   PURGE_EVENTS_GRACE_DAYS=180 npm run purge:events:apply
 *
 * Intended to run once a day from the host crontab, e.g.:
 *   0 4 * * *  cd /path/to/server && npm run purge:events:apply >> /var/log/purge-events.log 2>&1
 */

import { getDb } from '../services/firebase';
import {
  isEventExpired,
  purgeEventById,
  toPurgeableEvent,
} from '../services/eventPurge';

const shouldApply = process.argv.includes('--apply');
const graceDays = Number(process.env.PURGE_EVENTS_GRACE_DAYS ?? 90);

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Events are stored at midnight UTC, so the calendar day is all that matters. */
const fmtDay = (date: Date | null): string =>
  date ? date.toISOString().slice(0, 10) : '—';

/** The date the expiry rule actually judges on: end date, or start for one-day events. */
const effectiveEnd = (event: { startDate: Date | null; endDate: Date | null }): Date | null =>
  event.endDate ?? event.startDate;

const run = async () => {
  if (!Number.isFinite(graceDays) || graceDays < 0) {
    throw new Error(
      `Invalid PURGE_EVENTS_GRACE_DAYS: "${process.env.PURGE_EVENTS_GRACE_DAYS}"`,
    );
  }

  const now = new Date();
  const cutoff = new Date(now.getTime() - graceDays * MS_PER_DAY);
  console.log(`Mode:  ${shouldApply ? 'APPLY' : 'DRY RUN'}`);
  console.log(`Now:   ${now.toISOString().slice(0, 16).replace('T', ' ')} UTC`);
  console.log(`Rule:  delete events finished on or before ${fmtDay(cutoff)} (${graceDays}-day grace)`);
  console.log('');

  const snapshot = await getDb().collection('events').get();
  const expired = snapshot.docs
    .map(toPurgeableEvent)
    .filter((event) => isEventExpired(event, { now, graceDays }))
    .sort(
      (a, b) => (effectiveEnd(a)?.getTime() ?? 0) - (effectiveEnd(b)?.getTime() ?? 0),
    );

  console.log(
    `Scanned ${snapshot.size} event(s); ${expired.length} past the grace period.`,
  );
  expired.forEach((event) => {
    const when = event.endDate
      ? `${fmtDay(event.startDate)}…${fmtDay(event.endDate)}`
      : `${fmtDay(event.startDate)} (one-day)`;
    console.log(`  [OLD] ${when.padEnd(26)} "${event.title ?? ''}"  id=${event.id}`);
  });

  if (!shouldApply) {
    console.log('');
    console.log('DRY RUN. To apply, run: npm run purge:events:apply');
    return;
  }

  if (expired.length === 0) {
    return;
  }

  let purged = 0;
  for (const event of expired) {
    const result = await purgeEventById(event.id);
    if (result.status === 'purged') {
      purged += 1;
    }
    console.log(
      `  [${result.status.toUpperCase()}] id=${event.id} ` +
        `images=${result.imagesDeleted} backrefs=${result.backrefsCleaned}`,
    );
  }

  console.log('');
  console.log(`Deleted ${purged}/${expired.length} event(s).`);
};

run()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Event purge failed:', error);
    process.exit(1);
  });
