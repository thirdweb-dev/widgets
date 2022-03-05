import { IpfsStorage, ThirdwebSDK } from "@thirdweb-dev/sdk";
import { useEffect, useMemo } from "react";
import { ChainIDToRPCMap } from "./commonRPCUrls";
import { useSigner } from "./useSigner";

interface useSdkOptions {
  rpcUrl?: string;
  relayUrl?: string;
  expectedChainId: number;
  ipfsGateway?: string;
}

export function useSDKWithSigner({
  rpcUrl,
  relayUrl,
  expectedChainId,
  ipfsGateway,
}: useSdkOptions) {
  const signer = useSigner();

  const rpc = useMemo(() => {
    return rpcUrl || ChainIDToRPCMap[expectedChainId] || null;
  }, [rpcUrl, expectedChainId]);

  const sdk = useMemo(() => {
    if (!rpc) {
      return undefined;
    }
    const storage = ipfsGateway ? new IpfsStorage(ipfsGateway) : undefined;
    return new ThirdwebSDK(
      rpc,
      {
        readonlySettings: {
          rpcUrl: rpc,
        },
        gasless: relayUrl
          ? {
              openzeppelin: {
                relayerUrl: relayUrl,
              },
            }
          : undefined,
      },
      storage,
    );
  }, [rpc, relayUrl, ipfsGateway]);

  useEffect(() => {
    if (!sdk || !signer.data) {
      return;
    }
    sdk.updateSignerOrProvider(signer.data);
  }, [sdk, signer.data]);

  return sdk;
}
