import { createMockApi, respondToInvite } from '@/data/mock';

jest.useFakeTimers({ advanceTimers: true });

describe('flows added in the QA pass', () => {
  it('chaperone: invite -> accepted -> chaperone on; revoke turns it off', async () => {
    const api = createMockApi();
    api._state.autoReply = false;
    const inv = await api.invites.create('chaperone', { name: 'Sara', phone: '+14165550100' });
    expect(inv.status).toBe('sent');
    expect(inv.url).toMatch(/\/invite\?t=/);
    respondToInvite(api._state, inv.id);
    expect((await api.invites.list('chaperone'))[0]?.status).toBe('accepted');
    expect((await api.me.get()).chaperoneEnabled).toBe(true);
    expect((await api.inbox.list())[0]?.kind).toBe('chaperone_accepted');
    await api.invites.revoke(inv.id);
    expect(await api.invites.list('chaperone')).toHaveLength(0);
    expect((await api.me.get()).chaperoneEnabled).toBe(false);
  });

  it("Friend's Take: invite -> received (hidden) -> shown on my profile only after approval", async () => {
    const api = createMockApi();
    api._state.autoReply = false;
    const inv = await api.invites.create('friends_take', { name: 'Hina' });
    respondToInvite(api._state, inv.id);
    const [take] = await api.friendsTakes.mine();
    expect(take).toMatchObject({ author: 'Hina', approved: false });
    expect((await api.me.get()).friendsTakes).toHaveLength(0);
    await api.friendsTakes.setApproved(take!.id, true);
    expect((await api.me.get()).friendsTakes.map((f) => f.author)).toEqual(['Hina']);
    await api.friendsTakes.setApproved(take!.id, false);
    expect((await api.me.get()).friendsTakes).toHaveLength(0);
  });

  it('date check-in: scheduled -> prompt -> "I need help" ends the active check-in', async () => {
    const api = createMockApi();
    const c = await api.safety.createCheckIn({ matchId: 'm_ayesha', place: 'Cafe', startsAt: new Date().toISOString(), checkInAt: new Date().toISOString(), contact: { name: 'Sara', phone: '+14165550100' } });
    expect((await api.safety.activeCheckIn())?.id).toBe(c.id);
    expect((await api.inbox.list())[0]).toMatchObject({ kind: 'check_in', href: `/check-in-prompt/${c.id}` });
    await api.safety.requestHelp(c.id);
    expect(api._state.checkIns[0]?.status).toBe('help_requested');
    expect(await api.safety.activeCheckIn()).toBeNull();
  });

  it('date check-in: "I\'m okay" completes it', async () => {
    const api = createMockApi();
    const c = await api.safety.createCheckIn({ matchId: 'm_ayesha', place: 'Cafe', startsAt: new Date().toISOString(), checkInAt: new Date().toISOString(), contact: { name: 'Sara', phone: '+14165550100' } });
    await api.safety.confirmCheckIn(c.id);
    expect(await api.safety.activeCheckIn()).toBeNull();
  });
});
