import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { describe, it, expect } from 'vitest';
import { ShadowPollSimulator } from './shadowpoll-simulator.js';
import { randomBytes } from './utils.js';

setNetworkId('undeployed');

describe('ShadowPoll smart contract', () => {
  it('initializes public ledger state deterministically', () => {
    const question = 'Should we ship Level 1 tonight?';
    const id = randomBytes(32);
    const s0 = new ShadowPollSimulator(question, id, true);
    const s1 = new ShadowPollSimulator(question, id, true);
    expect(s0.getLedger().question).toEqual(question);
    expect(s1.getLedger().question).toEqual(question);
    expect(s0.getLedger().yesVotes).toEqual(0n);
    expect(s0.getLedger().noVotes).toEqual(0n);
    expect(s0.getLedger().voted.isEmpty()).toEqual(true);
  });

  it('lets a user cast a yes vote, updating only the public tally', () => {
    const simulator = new ShadowPollSimulator('Ship it?', randomBytes(32), true);
    const initialPrivateState = simulator.getPrivateState();
    simulator.castVote();

    // Private state (the raw choice) never changes as a side effect.
    expect(simulator.getPrivateState()).toEqual(initialPrivateState);

    const ledgerState = simulator.getLedger();
    expect(ledgerState.yesVotes).toEqual(1n);
    expect(ledgerState.noVotes).toEqual(0n);
    expect(ledgerState.voted.size()).toEqual(1n);
  });

  it('lets a user cast a no vote, updating only the public tally', () => {
    const simulator = new ShadowPollSimulator('Ship it?', randomBytes(32), false);
    simulator.castVote();

    const ledgerState = simulator.getLedger();
    expect(ledgerState.yesVotes).toEqual(0n);
    expect(ledgerState.noVotes).toEqual(1n);
    expect(ledgerState.voted.size()).toEqual(1n);
  });

  it('accumulates the tally across multiple distinct voters', () => {
    const simulator = new ShadowPollSimulator('Ship it?', randomBytes(32), true);
    simulator.castVote();
    simulator.switchUser(randomBytes(32), true);
    simulator.castVote();
    simulator.switchUser(randomBytes(32), false);
    simulator.castVote();

    const ledgerState = simulator.getLedger();
    expect(ledgerState.yesVotes).toEqual(2n);
    expect(ledgerState.noVotes).toEqual(1n);
    expect(ledgerState.voted.size()).toEqual(3n);
  });

  it('rejects a second vote from the same private identity', () => {
    const id = randomBytes(32);
    const simulator = new ShadowPollSimulator('Ship it?', id, true);
    simulator.castVote();
    expect(() => simulator.castVote()).toThrow('failed assert: You have already voted');

    // The rejected attempt must not have changed the public tally.
    const ledgerState = simulator.getLedger();
    expect(ledgerState.yesVotes).toEqual(1n);
    expect(ledgerState.noVotes).toEqual(0n);
    expect(ledgerState.voted.size()).toEqual(1n);
  });

  it('does not reveal a voter identity across independent votes with the same choice', () => {
    // Two distinct identities voting the same way must produce two distinct
    // nullifiers - nothing links them together on the public ledger.
    const simulator = new ShadowPollSimulator('Ship it?', randomBytes(32), true);
    simulator.castVote();
    const afterFirst = [...simulator.getLedger().voted];

    simulator.switchUser(randomBytes(32), true);
    simulator.castVote();
    const afterSecond = [...simulator.getLedger().voted];

    expect(afterSecond.length).toEqual(afterFirst.length + 1);
  });

  it('lets the creator close the poll', () => {
    const creatorId = randomBytes(32);
    const simulator = new ShadowPollSimulator('Ship it?', creatorId, true);
    expect(simulator.getLedger().closed).toEqual(false);

    simulator.closePoll();
    expect(simulator.getLedger().closed).toEqual(true);
  });

  it('rejects votes once the poll is closed', () => {
    const creatorId = randomBytes(32);
    const simulator = new ShadowPollSimulator('Ship it?', creatorId, true);
    simulator.closePoll();

    expect(() => simulator.castVote()).toThrow('failed assert: This poll is closed');

    // A rejected vote after closing must not have changed the public tally.
    const ledgerState = simulator.getLedger();
    expect(ledgerState.yesVotes).toEqual(0n);
    expect(ledgerState.noVotes).toEqual(0n);
  });

  it('rejects closePoll from anyone other than the creator', () => {
    const creatorId = randomBytes(32);
    const simulator = new ShadowPollSimulator('Ship it?', creatorId, true);

    // A different identity (e.g. a regular voter) cannot close the poll.
    simulator.switchUser(randomBytes(32), true);
    expect(() => simulator.closePoll()).toThrow('failed assert: Only the poll creator can close it');
    expect(simulator.getLedger().closed).toEqual(false);
  });

  it('rejects closing an already-closed poll', () => {
    const creatorId = randomBytes(32);
    const simulator = new ShadowPollSimulator('Ship it?', creatorId, true);
    simulator.closePoll();

    expect(() => simulator.closePoll()).toThrow('failed assert: This poll is already closed');
  });

  it('does not link the creator role to the creator\'s own vote', () => {
    // The creator can also vote, using the same secret ID - their voter
    // nullifier and creator nullifier live in separate hash domains, so
    // nothing on the public ledger connects the two roles.
    const creatorId = randomBytes(32);
    const simulator = new ShadowPollSimulator('Ship it?', creatorId, true);
    simulator.castVote();

    const ledgerState = simulator.getLedger();
    expect(ledgerState.voted.size()).toEqual(1n);
    // The creator nullifier (a fixed, separate value) is never itself a
    // member of the voter nullifier set.
    expect(ledgerState.voted.member(ledgerState.creatorNullifier)).toEqual(false);
  });
});
