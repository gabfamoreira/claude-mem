
import { Database } from 'bun:sqlite';
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- tests/logger-usage-standards.test.ts requires high-priority files to import logger
import { logger } from '../../../utils/logger.js';

export function getFirstObservationCreatedAt(db: Database): string | null {
  const stmt = db.prepare(`
    SELECT created_at
    FROM observations
    ORDER BY created_at_epoch ASC
    LIMIT 1
  `);

  const row = stmt.get() as { created_at: string } | undefined;
  return row ? row.created_at : null;
}
