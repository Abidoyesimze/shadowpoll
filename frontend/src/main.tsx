// Several @midnight-ntwrk packages assume a Node-like global Buffer (they
// were written primarily for the CLI/server side); polyfill it for the
// browser before anything else runs.
import { Buffer } from 'buffer';
if (!('Buffer' in globalThis)) {
  (globalThis as typeof globalThis & { Buffer: typeof Buffer }).Buffer = Buffer;
}

import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { NETWORK } from './lib/env';
setNetworkId(NETWORK);

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
