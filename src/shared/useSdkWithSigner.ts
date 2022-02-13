import { ThirdwebSDK } from "@3rdweb/sdk";
import { useEffect, useMemo } from "react";
import { ChainIDToRPCMap } from "./commonRPCUrls";
import { useSigner } from "./useSigner";

interface useSdkOptions {
  rpcUrl?: string;
  relayUrl?: string;
  expectedChainId: number;
}

export function useSDKWithSigner({
  rpcUrl,
  relayUrl,
  expectedChainId,
}: useSdkOptions) {
  const signer = useSigner();

  const rpc = useMemo(() => {
    return rpcUrl || ChainIDToRPCMap[expectedChainId] || null;
  }, [rpcUrl, expectedChainId]);

  const sdk = useMemo(() => {
    if (!rpc) {
      return undefined;
    }
    return new ThirdwebSDK(rpc, {
      readonlySettings: {
        rpcUrl: rpc,
      },
    });
  }, [rpc, expectedChainId, relayUrl]);

  useEffect(() => {
    if (!sdk || !signer.data) {
      return;
    }
    sdk.updateSignerOrProvider(signer.data);
  }, [sdk, signer.data]);

  return sdk;
}
