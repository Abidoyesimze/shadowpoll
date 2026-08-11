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
});
