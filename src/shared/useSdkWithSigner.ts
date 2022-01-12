import { ThirdwebSDK } from "@3rdweb/sdk";
import { Signer } from "ethers";
import { useEffect, useMemo, useState } from "react";
import { useAccount } from "wagmi";
import { ChainIDToRPCMap } from "./commonRPCUrls";

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
  const [{ data }] = useAccount();
  const connector = useMemo(() => data?.connector, [data]);

  const rpc = useMemo(() => {
    return rpcUrl || ChainIDToRPCMap[expectedChainId] || null;
  }, [rpcUrl, expectedChainId]);

  const sdk = useMemo(() => {
    if (!rpc) {
      return undefined;
    }
    return new ThirdwebSDK(rpc, {
      transactionRelayerUrl: relayUrl,
      readOnlyRpcUrl: rpcUrl,
    });
  }, [relayUrl]);

  const [signer, setSigner] = useState<Signer | undefined>(undefined);
  useEffect(() => {
    let isMounted = true;
    if (connector) {
      (async () => {
        const signer = await connector.getSigner();
        if (isMounted) {
          setSigner(signer);
        }
      })();
    }
    return () => {
      isMounted = false;
    };
  }, [connector]);

  useEffect(() => {
    if (!sdk || !Signer.isSigner(signer)) {
      return;
    }
    sdk.setProviderOrSigner(signer);
  }, [sdk, signer]);

  return sdk;
}
