import {
  ChainId,
  SUPPORTED_CHAIN_ID,
  SUPPORTED_CHAIN_IDS,
} from "@thirdweb-dev/sdk";
import { defaultChains } from "wagmi";

export const ChainIDToName: Record<SUPPORTED_CHAIN_ID, string> = {
  [ChainId.Mainnet]: "Ethereum Mainnet",
  [ChainId.Rinkeby]: "Rinkeby",
  [ChainId.Goerli]: "Goerli",
  [ChainId.Polygon]: "Polygon Mainnet",
  [ChainId.Mumbai]: "Mumbai",
  [ChainId.Fantom]: "Fantom Opera",
  [ChainId.FantomTestnet]: "Fantom Testnet",
  [ChainId.Avalanche]: "Avalanche",
  [ChainId.AvalancheFujiTestnet]: "Avalanche Fuji Testnet",
  [ChainId.Optimism]: "Optimism",
  [ChainId.OptimismTestnet]: "Optimism Kovan",
  [ChainId.Arbitrum]: "Arbitrum One",
  [ChainId.ArbitrumTestnet]: "Arbitrum Rinkeby",
};

export const supportedChains = defaultChains.filter((c) =>
  SUPPORTED_CHAIN_IDS.includes(c.id),
);
