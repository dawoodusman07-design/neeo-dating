export const MIN_AGE = 18;

/** Whole years between dob (yyyy-mm-dd) and `now`. Returns NaN for invalid dates. */
export function ageFromDob(dob: string, now: Date = new Date()): number {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dob);
  if (!m) return NaN;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const date = new Date(Date.UTC(y, mo - 1, d));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== mo - 1 || date.getUTCDate() !== d) return NaN;
  let age = now.getUTCFullYear() - y;
  const beforeBirthday =
    now.getUTCMonth() < mo - 1 || (now.getUTCMonth() === mo - 1 && now.getUTCDate() < d);
  if (beforeBirthday) age -= 1;
  return age;
}

export function isEligible(dob: string, now?: Date) {
  const a = ageFromDob(dob, now);
  return Number.isFinite(a) && a >= MIN_AGE && a < 120;
}
