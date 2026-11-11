import { createMockApi, MOCK_OTP, DAILY_LIMIT } from '@/data/mock';
import { ApiError } from '@/data/types';

jest.useFakeTimers({ advanceTimers: true });

describe('mock backend (critical path)', () => {
  it('signup → like → match → chat → report → block → delete', async () => {
    const api = createMockApi();
    api._state.autoReply = false;

    // OTP: wrong code, then lockout after 5 attempts
    await expect(api.auth.verifyOtp('+15555550100', '000000')).rejects.toMatchObject({ code: 'invalid_code' });
    const { onboarded } = await api.auth.verifyOtp('+15555550100', MOCK_OTP);
    expect(onboarded).toBe(false);

    await api.me.completeOnboarding({
      dob: '1995-01-01', firstName: 'Sam', intention: 'long_term', photoUris: ['a', 'b', 'c'],
      prompts: [{ question: 'Q', answer: 'A long enough answer' }], dateIdeas: ['Coffee and a walk'], city: 'Toronto',
    });
    const me = await api.me.get();
    expect(me.photos.every((p) => p.status === 'pending')).toBe(true); // moderation pending

    const intros = await api.discover.introductions();
    expect(intros.total).toBe(DAILY_LIMIT);
    const maya = intros.items.find((p) => p.id === 'p_maya')!;
    const { matchId } = await api.discover.like(maya.id, { kind: 'photo', id: maya.photos[0]!.id }, 'Love this photo');
    expect(matchId).toBeTruthy();

    const msgs = await api.messages.list(matchId!);
    expect(msgs.at(-1)!.body).toBe('Love this photo');
    await api.messages.send(matchId!, { kind: 'text', body: 'Hi Maya' });

    const { reportId } = await api.safety.report(maya.id, 'harassment');
    expect(reportId).toBeTruthy();
    await api.safety.block(maya.id);
    expect((await api.matches.list()).find((m) => m.id === matchId)).toBeUndefined();
    expect((await api.discover.introductions()).items.find((p) => p.id === maya.id)).toBeUndefined();
    expect(await api.safety.blocked()).toHaveLength(1);

    await api.auth.reauthenticate(MOCK_OTP);
    await api.me.deleteAccount();
    expect((await api.me.get()).firstName).toBe('Sam'); // reset to seed state
    expect(await api.safety.blocked()).toHaveLength(0);
  });

  it('locks OTP after 5 wrong attempts', async () => {
    const api = createMockApi();
    let last: unknown;
    for (let i = 0; i < 5; i++) last = await api.auth.verifyOtp('+1', '000000').catch((e) => e);
    expect(last).toBeInstanceOf(ApiError);
    expect((last as ApiError).code).toBe('otp_locked');
    await expect(api.auth.sendOtp('+1')).rejects.toMatchObject({ code: 'otp_locked' });
  });

  it('undo restores the last passed profile', async () => {
    const api = createMockApi();
    const before = await api.discover.introductions();
    await api.discover.pass(before.items[0]!.id);
    expect((await api.discover.introductions()).items[0]!.id).not.toBe(before.items[0]!.id);
    const restored = await api.discover.undo();
    expect(restored!.id).toBe(before.items[0]!.id);
  });

  it('photo access can be shared and revoked', async () => {
    const api = createMockApi();
    const [req] = (await api.privacy.requests()).filter((r) => r.status === 'pending');
    await api.privacy.respond(req!.id, 'shared');
    await api.privacy.revoke(req!.id);
    expect((await api.privacy.requests()).find((r) => r.id === req!.id)!.status).toBe('revoked');
  });
});
