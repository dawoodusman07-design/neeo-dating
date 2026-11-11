import * as Contacts from 'expo-contacts';
import * as Crypto from 'expo-crypto';

/** Normalise to digits with leading + where present, then SHA-256. Raw numbers never leave the device. */
export function normalisePhone(raw: string, defaultCountryCode = '1') {
  const digits = raw.replace(/[^\d+]/g, '');
  if (digits.startsWith('+')) return digits;
  if (digits.startsWith('00')) return `+${digits.slice(2)}`;
  return `+${defaultCountryCode}${digits.replace(/^0+/, '')}`;
}

export async function hashedContactNumbers(defaultCountryCode = '1'): Promise<string[] | 'denied'> {
  const { status } = await Contacts.requestPermissionsAsync();
  if (status !== 'granted') return 'denied';
  const { data } = await Contacts.getContactsAsync({ fields: [Contacts.Fields.PhoneNumbers] });
  const numbers = new Set<string>();
  for (const c of data) for (const p of c.phoneNumbers ?? []) if (p.number) numbers.add(normalisePhone(p.number, defaultCountryCode));
  return Promise.all(
    [...numbers].map((n) => Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, n)),
  );
}
