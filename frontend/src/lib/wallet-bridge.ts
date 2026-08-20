// Bridges the Lace wallet's injected dapp-connector API (window.midnight.*)
// to the WalletProvider/MidnightProvider interfaces that @midnight-ntwrk/
// midnight-js-contracts expects. This is the browser counterpart to the
// CLI's MidnightWalletProvider (cli/src/midnight-wallet-provider.ts), which
// instead builds a wallet directly from a seed - here, the wallet's own
// extension holds the keys and does the signing.
import type { ConnectedAPI, InitialAPI, KeyMaterialProvider, ProvingProvider } from '@midnight-ntwrk/dapp-connector-api';
import type { WalletProvider, MidnightProvider, UnboundTransaction } from '@midnight-ntwrk/midnight-js-types';
import {
  Transaction,
  SignatureEnabled,
  Proof,
  Binding,
  type FinalizedTransaction,
  type TransactionId,
} from '@midnight-ntwrk/midnight-js-protocol/ledger';
import { getNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { toHex, fromHex, parseCoinPublicKeyToHex, parseEncPublicKeyToHex } from '@midnight-ntwrk/midnight-js-utils';

export class LaceWalletBridge implements WalletProvider, MidnightProvider {
  private constructor(
    private readonly connected: ConnectedAPI,
    private readonly coinPublicKey: string,
    private readonly encryptionPublicKey: string,
    public readonly unshieldedAddress: string,
  ) {}

  static async connect(): Promise<LaceWalletBridge> {
    const initialApi = LaceWalletBridge.findInjectedWallet();
    const connected = await initialApi.connect(getNetworkId());

    const { shieldedCoinPublicKey, shieldedEncryptionPublicKey } = await connected.getShieldedAddresses();
    const { unshieldedAddress } = await connected.getUnshieldedAddress();
    const networkId = getNetworkId();

    return new LaceWalletBridge(
      connected,
      parseCoinPublicKeyToHex(shieldedCoinPublicKey, networkId),
      parseEncPublicKeyToHex(shieldedEncryptionPublicKey, networkId),
      unshieldedAddress,
    );
  }

  private static findInjectedWallet(): InitialAPI {
    const candidates = Object.values(window.midnight ?? {});
    if (candidates.length === 0) {
      throw new Error('No Midnight wallet extension found. Install the Lace wallet and reload this page.');
    }
    // Prefer the Lace wallet if multiple compatible wallets are injected.
    return candidates.find((api) => api.rdns.includes('lace')) ?? candidates[0];
  }

  getCoinPublicKey(): string {
    return this.coinPublicKey;
  }

  getEncryptionPublicKey(): string {
    return this.encryptionPublicKey;
  }

  async balanceTx(tx: UnboundTransaction): Promise<FinalizedTransaction> {
    const { tx: balancedHex } = await this.connected.balanceUnsealedTransaction(toHex(tx.serialize()));
    return Transaction.deserialize<SignatureEnabled, Proof, Binding>(
      'signature',
      'proof',
      'binding',
      fromHex(balancedHex),
    );
  }

  async submitTx(tx: FinalizedTransaction): Promise<TransactionId> {
    await this.connected.submitTransaction(toHex(tx.serialize()));
    return tx.transactionHash();
  }

  // Delegates proving to the wallet itself, rather than requiring a proof
  // server the visitor has to run locally - this is what lets a publicly
  // hosted deployment of this frontend actually be usable end to end by
  // anyone with a compatible wallet installed, no local Docker setup needed.
  getProvingProvider(keyMaterialProvider: KeyMaterialProvider): Promise<ProvingProvider> {
    return this.connected.getProvingProvider(keyMaterialProvider);
  }
}
