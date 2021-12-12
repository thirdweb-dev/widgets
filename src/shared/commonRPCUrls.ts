export const ChainIDToRPCMap: Record<number, string> = {
  1: "mainnet",
  4: "rinkeby",
  137: "https://polygon-rpc.com",
  250: "https://rpc.ftm.tools",
  43114: "https://api.avax.network/ext/bc/C/rpc",
  80001: "https://rpc-mumbai.maticvigil.com",
};

export const ChainIDToNativeSymbol: Record<number, string> = {
  1: "ETH",
  4: "ETH",
  137: "MATIC",
  250: "FTM",
  43114: "AVAX",
  80001: "MATIC",
};
