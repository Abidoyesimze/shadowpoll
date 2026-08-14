import type { InitialAPI } from '@midnight-ntwrk/dapp-connector-api';

// Wallets inject their Initial API under `window.midnight`, keyed by an
// implementation-defined name (e.g. `mnLace` for the Lace wallet).
declare global {
  interface Window {
    midnight?: Record<string, InitialAPI>;
  }
}
