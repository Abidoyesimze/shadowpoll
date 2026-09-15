import { type CircuitContext, QueryContext, sampleContractAddress, createConstructorContext, CostModel } from '@midnight-ntwrk/compact-runtime';
import { Contract, type Ledger, ledger } from '../managed/shadowpoll/contract/index.js';
import { type ShadowPollPrivateState, witnesses, createShadowPollPrivateState } from '../witnesses.js';

/**
 * Serves as a testbed to exercise the ShadowPoll contract in tests.
 */
export class ShadowPollSimulator {
  readonly contract: Contract<ShadowPollPrivateState>;
  circuitContext: CircuitContext<ShadowPollPrivateState>;

  constructor(question: string, secretId: Uint8Array, choice: boolean) {
    this.contract = new Contract<ShadowPollPrivateState>(witnesses);
    const { currentPrivateState, currentContractState, currentZswapLocalState } = this.contract.initialState(
      createConstructorContext(createShadowPollPrivateState(secretId, choice), '0'.repeat(64)),
      question,
    );
    this.circuitContext = {
      currentPrivateState,
      currentZswapLocalState,
      costModel: CostModel.initialCostModel(),
      currentQueryContext: new QueryContext(currentContractState.data, sampleContractAddress()),
    };
  }

  /** Switch to a different private identity (new secret ID and/or choice). */
  public switchUser(secretId: Uint8Array, choice: boolean) {
    this.circuitContext.currentPrivateState = createShadowPollPrivateState(secretId, choice);
  }

  public getLedger(): Ledger {
    return ledger(this.circuitContext.currentQueryContext.state);
  }

  public getPrivateState(): ShadowPollPrivateState {
    return this.circuitContext.currentPrivateState;
  }

  public castVote(): Ledger {
    this.circuitContext = this.contract.impureCircuits.castVote(this.circuitContext).context;
    return ledger(this.circuitContext.currentQueryContext.state);
  }

  public closePoll(): Ledger {
    this.circuitContext = this.contract.impureCircuits.closePoll(this.circuitContext).context;
    return ledger(this.circuitContext.currentQueryContext.state);
  }
}
