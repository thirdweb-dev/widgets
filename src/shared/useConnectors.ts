import { useMemo } from "react";
import {
  InjectedConnector,
  WalletConnectConnector,
  WalletLinkConnector,
} from "wagmi";
import { ChainIDToRPCMap, supportedChains } from "../shared/commonRPCUrls";

export function useConnectors(expectedChainId: number, rpcUrl?: string) {
  return useMemo(
    () => [
      new InjectedConnector({
        chains: supportedChains.filter((c) => c.id === expectedChainId),
      }),
      new WalletConnectConnector({
        chains: supportedChains.filter((c) => c.id === expectedChainId),
        options: {
          qrcode: true,
          rpc: rpcUrl ? { [expectedChainId]: rpcUrl } : ChainIDToRPCMap,
          chainId: expectedChainId,
          clientMeta: {
            name: "thirdweb - embed",
            description: "thirdweb - embed",
            icons: ["https://thirdweb.com/favicon.ico"],
            url: "https://thirdweb.com",
          },
        },
      }),
      new WalletLinkConnector({
        chains: supportedChains.filter((c) => c.id === expectedChainId),
        options: {
          appName: "thirdweb - embed",
          appLogoUrl: "https://thirdweb.com/favicon.ico",
          darkMode: false,
          jsonRpcUrl: rpcUrl || ChainIDToRPCMap[expectedChainId],
        },
      }),
    ],
    [expectedChainId],
  );
}
