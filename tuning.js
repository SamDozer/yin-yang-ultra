// tuning.js - pentatonic bases and the 3:2 relation between the two voices
export const PENTATONIC_BASE_HZ = [65.41, 73.42, 82.41, 98.0, 110.0]; // C D E G A

export function voiceFrequencies(baseHz, imbalance) {
  const cents = Math.max(0, Math.min(1, imbalance)) * 45;
  return { yin: baseHz, yang: baseHz * 1.5 * 2 ** (cents / 1200) };
}
