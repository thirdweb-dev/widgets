import { ChainId } from "@thirdweb-dev/react";
import { defaultChains, defaultL2Chains } from "wagmi";

export const ChainIDToNativeSymbol: Record<number, string> = {
  1: "ETH",
  4: "ETH",
  5: "ETH",
  137: "MATIC",
  250: "FTM",
  43114: "AVAX",
  80001: "MATIC",
};

export const ChainIDToName: Record<number, string> = {
  1: "Mainnet",
  4: "Rinkeby",
  5: "Goerli",
  137: "Polygon",
  250: "Fantom",
  43114: "Avalanche",
  80001: "Mumbai",
};

export const SUPPORTED_CHAIN_IDS = [
  ChainId.Mainnet,
  ChainId.Rinkeby,
  ChainId.Goerli,
  ChainId.Mumbai,
  ChainId.Polygon,
  ChainId.Fantom,
  ChainId.FantomTestnet,
  ChainId.Avalanche,
  ChainId.AvalancheFujiTestnet,
];

export const supportedChains = defaultChains
  .concat(defaultL2Chains)
  .filter((c) => SUPPORTED_CHAIN_IDS.includes(c.id));
