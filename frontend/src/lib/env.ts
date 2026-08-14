// Network configuration for the frontend. Defaults to Preview, matching the
// network the contract in the README was actually deployed to.
export type Network = 'preview' | 'preprod';

export const NETWORK: Network = (import.meta.env.VITE_NETWORK as Network) ?? 'preview';

export const CONTRACT_ADDRESS =
  import.meta.env.VITE_CONTRACT_ADDRESS ?? 'e5facde142e36093a5430224340c8ebf7675ed90fdfdeb6be7183f895458d34d';

export const INDEXER_HTTP_URL = `https://indexer.${NETWORK}.midnight.network/api/v4/graphql`;
export const INDEXER_WS_URL = `wss://indexer.${NETWORK}.midnight.network/api/v4/graphql/ws`;

// A local proof server is required for casting a vote (proving happens
// against ZK keys served from /managed, see scripts/copy-managed.mjs) - the
// same one used by the CLI's deploy scripts:
//   cd cli && docker compose -f proof-server-local.yml up -d
export const PROOF_SERVER_URL = import.meta.env.VITE_PROOF_SERVER_URL ?? 'http://localhost:6300';

export const ZK_CONFIG_BASE_URL = `${import.meta.env.BASE_URL}managed/shadowpoll`;
