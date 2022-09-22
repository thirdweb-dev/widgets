import { ChainId, SUPPORTED_CHAIN_ID } from "@thirdweb-dev/sdk";

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
  [ChainId.OptimismKovan]: "Optimism Kovan",
  [ChainId.OptimismGoerli]: "Optimism Goerli",
  [ChainId.Arbitrum]: "Arbitrum One",
  [ChainId.ArbitrumRinkeby]: "Arbitrum Rinkeby",
  [ChainId.ArbitrumGoerli]: "Arbitrum Goerli",
  [ChainId.BinanceSmartChainMainnet]: "Binance Smart Chain Mainnet",
  [ChainId.BinanceSmartChainTestnet]: "Binance Smart Chain Testnet",
};
