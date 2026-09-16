// Live poll state read directly from the public indexer - no wallet
// connection required. This is the same publicDataProvider + ledger()
// pattern the CLI uses in getShadowPollLedgerState (cli/src/index.ts), just
// wired reactively instead of as a one-shot query.
import { useEffect, useState } from 'react';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { ledger } from '@shadowpoll/contract';
import { INDEXER_HTTP_URL, INDEXER_WS_URL } from '../lib/env';

export type PollState = {
  question: string;
  yesVotes: bigint;
  noVotes: bigint;
  closed: boolean;
};

export type PollStateStatus =
  | { status: 'loading' }
  | { status: 'ready'; poll: PollState }
  | { status: 'error'; message: string };

export const usePollState = (contractAddress: string): PollStateStatus => {
  const [status, setStatus] = useState<PollStateStatus>({ status: 'loading' });

  useEffect(() => {
    setStatus({ status: 'loading' });
    const publicDataProvider = indexerPublicDataProvider(INDEXER_HTTP_URL, INDEXER_WS_URL);
    const subscription = publicDataProvider.contractStateObservable(contractAddress, { type: 'latest' }).subscribe({
      next: (contractState) => {
        const ledgerState = ledger(contractState.data);
        setStatus({
          status: 'ready',
          poll: {
            question: ledgerState.question,
            yesVotes: ledgerState.yesVotes,
            noVotes: ledgerState.noVotes,
            closed: ledgerState.closed,
          },
        });
      },
      error: (error) => setStatus({ status: 'error', message: error instanceof Error ? error.message : String(error) }),
    });
    return () => subscription.unsubscribe();
  }, [contractAddress]);

  return status;
};
