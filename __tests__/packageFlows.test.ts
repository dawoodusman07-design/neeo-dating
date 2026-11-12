import { createMockApi, MOCK_OTP } from '@/data/mock';
import { fromSchema } from '@/ui/useField';
import { deleteConfirmSchema, phoneSchema, supportBodySchema, timeSchema } from '@/data/types';

jest.useFakeTimers({ advanceTimers: true });

describe('form validators', () => {
  it('return the first error message, or undefined when valid', () => {
    expect(fromSchema(phoneSchema)('123')).toMatch(/international format/);
    expect(fromSchema(phoneSchema)('+14165550100')).toBeUndefined();
    expect(fromSchema(supportBodySchema)('short')).toMatch(/at least 10/);
    expect(fromSchema(deleteConfirmSchema)('delete')).toBeUndefined();
    expect(fromSchema(deleteConfirmSchema)('nope')).toMatch(/Type DELETE/);
    expect(fromSchema(timeSchema)('25:00')).toBeDefined();
  });
});

describe('package states in the mock backend', () => {
  it('OTP: rate limit after 3 codes in 10 minutes', async () => {
    const api = createMockApi();
    for (let i = 0; i < 3; i++) await api.auth.sendOtp('+15550000000');
    await expect(api.auth.sendOtp('+15550000000')).rejects.toMatchObject({ code: 'rate_limited' });
  });

  it('OTP: wrong code reports attempts left', async () => {
    const api = createMockApi();
    await expect(api.auth.verifyOtp('+1', '000000')).rejects.toMatchObject({ code: 'invalid_code', message: '4 attempts left' });
    await expect(api.auth.verifyOtp('+1', MOCK_OTP)).resolves.toBeTruthy();
  });

  it('ending a connection keeps it listed (reportable) but removes the conversation', async () => {
    const api = createMockApi();
    const [m] = await api.matches.list();
    await api.matches.unmatch(m!.id);
    const after = (await api.matches.list()).find((x) => x.id === m!.id);
    expect(after?.endedAt).toBeTruthy();
    expect(await api.messages.list(m!.id)).toHaveLength(0);
    await expect(api.messages.send(m!.id, { kind: 'text', body: 'hi' })).rejects.toMatchObject({ code: 'send_failed' });
  });

  it('message delivery failure surfaces as send_failed', async () => {
    const api = createMockApi();
    api._state.failSends = true;
    const [m] = await api.matches.list();
    await expect(api.messages.send(m!.id, { kind: 'text', body: 'hi' })).rejects.toMatchObject({ code: 'send_failed' });
  });

  it('support: request gets a reference and keeps the conversation', async () => {
    const api = createMockApi();
    const tkt = await api.support.create({ topic: 'billing', body: 'I was charged twice this month' });
    expect(tkt.reference).toMatch(/^NE-\d{6}$/);
    const next = await api.support.reply(tkt.id, 'Here is my receipt number');
    expect(next.messages).toHaveLength(2);
    expect(await api.support.list()).toHaveLength(1);
  });

  it('report → inbox outcome item; appeal → listed as open', async () => {
    const api = createMockApi();
    await api.safety.report('p_omar', 'scam');
    expect((await api.inbox.list())[0]!.kind).toBe('report_outcome');
    await api.safety.appeal('I think this was a mistake.');
    expect((await api.safety.appeals())[0]!.status).toBe('open');
  });

  it('preferences round-trip; photo grant appears in access list', async () => {
    const api = createMockApi();
    const prefs = await api.me.preferences();
    await api.me.setPreferences({ ...prefs, ageMin: 30 });
    expect((await api.me.preferences()).ageMin).toBe(30);
    await api.privacy.grant('p_omar');
    expect((await api.privacy.requests()).some((r) => r.profile.id === 'p_omar' && r.status === 'shared')).toBe(true);
  });
});
