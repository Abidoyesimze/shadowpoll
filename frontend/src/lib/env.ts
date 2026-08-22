// Network configuration for the frontend. Level 2 asks for Preprod, but its
// faucet is currently rejecting every request from testkit-js's FaucetClient
// (wrong endpoint/request shape - see the README's Level 2 section for the
// full finding), with no way to fund a deploying wallet there right now.
// Defaults to Preview - the network the contract is actually deployed to -
// until that's resolved. Override with VITE_NETWORK=preprod once it's fixed.
export type Network = 'preview' | 'preprod';

export const NETWORK: Network = (import.meta.env.VITE_NETWORK as Network) ?? 'preview';

export const CONTRACT_ADDRESS =
  import.meta.env.VITE_CONTRACT_ADDRESS ?? 'e5facde142e36093a5430224340c8ebf7675ed90fdfdeb6be7183f895458d34d';

export const INDEXER_HTTP_URL = `https://indexer.${NETWORK}.midnight.network/api/v4/graphql`;
export const INDEXER_WS_URL = `wss://indexer.${NETWORK}.midnight.network/api/v4/graphql/ws`;

// By default, proving is delegated to the connected wallet (see
// wallet-bridge.ts's getProvingProvider), so this frontend works for any
// visitor with a compatible wallet installed - no local setup needed. Set
// VITE_USE_LOCAL_PROOF_SERVER=true to instead prove against a proof server
// you run yourself (matches the CLI's setup):
//   cd cli && docker compose -f proof-server-local.yml up -d
export const USE_LOCAL_PROOF_SERVER = import.meta.env.VITE_USE_LOCAL_PROOF_SERVER === 'true';
export const PROOF_SERVER_URL = import.meta.env.VITE_PROOF_SERVER_URL ?? 'http://localhost:6300';

// FetchZkConfigProvider requires an absolute URL (it does `new URL(baseURL)`
// with no base, which throws on a plain path like "/managed/shadowpoll") -
// resolve against the current origin to make it one.
export const ZK_CONFIG_BASE_URL = new URL(`${import.meta.env.BASE_URL}managed/shadowpoll`, window.location.origin).toString();
