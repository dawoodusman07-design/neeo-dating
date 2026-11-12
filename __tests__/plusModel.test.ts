import { createMockApi } from '@/data/mock';
import { usesPlusFilters } from '@/data/types';
import { MockPurchaseService, purchases } from '@/services/purchases';

jest.useFakeTimers({ advanceTimers: true });
const store = purchases as MockPurchaseService;

beforeEach(() => store.simulate('free'));

describe('Plus model: likes free; Plus = advanced filters, presets, travel mode', () => {
  it('free users see who liked them, with comments, and can like back', async () => {
    const api = createMockApi();
    expect((await store.getMembership()).status).toBe('free');
    const likes = await api.likes.received();
    expect(likes.map((l) => l.profile.firstName)).toEqual(['Lena', 'Omar']);
    expect(likes[0]!.comment).toBe('What are you reading right now?');
    const { matchId } = await api.discover.like(likes[0]!.profile.id);
    expect(matchId).toBeTruthy(); // replying to a like is free
  });

  it('free users cannot turn ON advanced filters or travel mode', async () => {
    const api = createMockApi();
    const p = await api.me.preferences();
    await expect(api.me.setPreferences({ ...p, verifiedOnly: true })).rejects.toMatchObject({ code: 'plus_required' });
    await expect(api.me.setPreferences({ ...p, voiceOnly: true })).rejects.toMatchObject({ code: 'plus_required' });
    await expect(api.me.setPreferences({ ...p, travelCity: 'Lahore' })).rejects.toMatchObject({ code: 'plus_required' });
    await expect(api.me.savePreset('Weekend', p)).rejects.toMatchObject({ code: 'plus_required' });
    await expect(api.me.setPreferences({ ...p, ageMin: 27 })).resolves.toBeUndefined(); // free preferences still work
  });

  it('Plus members can use them; after Plus ends they can switch them off and delete presets', async () => {
    const api = createMockApi();
    store.simulate('active');
    const p = await api.me.preferences();
    await api.me.setPreferences({ ...p, verifiedOnly: true, travelCity: 'Lahore' });
    const preset = await api.me.savePreset('Lahore trip', { ...p, travelCity: 'Lahore' });
    expect(await api.me.presets()).toHaveLength(1);
    store.simulate('expired');
    const on = await api.me.preferences();
    expect(usesPlusFilters(on)).toBe(true);
    await api.me.setPreferences({ ...on, verifiedOnly: false, travelCity: null });
    await api.me.deletePreset(preset.id);
    expect(await api.me.presets()).toHaveLength(0);
  });

  it('renewal-off and billing-grace members keep Plus features', async () => {
    const api = createMockApi();
    const p = await api.me.preferences();
    for (const s of ['renewal_off', 'billing_issue'] as const) {
      store.simulate(s);
      await expect(api.me.setPreferences({ ...p, voiceOnly: true })).resolves.toBeUndefined();
      await api.me.setPreferences({ ...p, voiceOnly: false });
    }
  });
});

describe('synced lists: saved profiles, date plans, private notes', () => {
  it('round-trip and hide blocked people', async () => {
    const api = createMockApi();
    await api.saved.saveProfile('p_maya');
    await api.saved.saveProfile('p_omar');
    expect((await api.saved.profiles()).map((s) => s.profile.id).sort()).toEqual(['p_maya', 'p_omar']);
    await api.safety.block('p_omar');
    expect((await api.saved.profiles()).map((s) => s.profile.id)).toEqual(['p_maya']);
    await api.saved.removeProfile('p_maya');
    expect(await api.saved.profiles()).toHaveLength(0);

    await api.saved.savePlan({ id: 'msg_1', matchId: 'm_ayesha', name: 'Ayesha', idea: 'Dessert spot', when: 'Saturday' });
    await api.saved.savePlan({ id: 'msg_1', matchId: 'm_ayesha', name: 'Ayesha', idea: 'Dessert spot', when: 'Sunday' });
    const plans = await api.saved.plans();
    expect(plans).toHaveLength(1); // saving again updates, no duplicate
    expect(plans[0]!.when).toBe('Sunday');

    await api.notes.set('p_maya', '  Loves Rouge Park  ');
    expect(await api.notes.get('p_maya')).toBe('Loves Rouge Park');
    await api.notes.set('p_maya', '');
    expect(await api.notes.get('p_maya')).toBe('');
    await expect(api.notes.set('p_maya', 'x'.repeat(1001))).rejects.toBeTruthy();
  });
});
