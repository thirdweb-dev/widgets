import { ThirdwebSDK } from "@3rdweb/sdk";
import { Signer } from "ethers";
import { useEffect, useMemo, useState } from "react";
import { useAccount, useNetwork, useSigner } from "wagmi";
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
  const [{ data: network }] = useNetwork();
  const [{ data: signer }, getSigner] = useSigner();
  const connector = useMemo(() => data?.connector, [data]);

  const rpc = useMemo(() => {
    return rpcUrl || ChainIDToRPCMap[expectedChainId] || null;
  }, [rpcUrl, expectedChainId]);

  const sdk = useMemo(() => {
    if (!rpc) {
      return undefined;
    }
    return new ThirdwebSDK(rpc, {
      thirdwebModuleFactory: "0x0000000000000000000000000000000000000000",
      readOnlyRpcUrl: rpc,
    });
  }, [relayUrl]);

  useEffect(() => {
    getSigner();
  }, [connector, data?.address, network.chain?.id]);

  useEffect(() => {
    if (!sdk || !Signer.isSigner(signer)) {
      return;
    }
    sdk.updateSignerOrProvider(signer);
  }, [sdk, signer]);

  return sdk;
}
