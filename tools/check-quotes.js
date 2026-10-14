// Fails when any passage has not been verified against a public edition.
import { PASSAGES } from '../texts.js';

const pending = PASSAGES.filter(p => p.verified !== true);
if (pending.length) {
  console.error('Unverified passages:\n' + pending.map(p => `  - ${p.id} (${p.source.book} ${p.source.chapter})`).join('\n'));
  process.exit(1);
}
console.log(`All ${PASSAGES.length} passages verified.`);
