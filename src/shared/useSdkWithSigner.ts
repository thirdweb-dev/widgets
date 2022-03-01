import { ISDKOptions, ThirdwebSDK } from "@3rdweb/sdk";
import { Signer } from "ethers";
import { useEffect, useMemo } from "react";
import { useAccount, useNetwork, useSigner } from "wagmi";
import { ChainIDToRPCMap } from "./commonRPCUrls";

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
    const opts: Partial<ISDKOptions> = {
      transactionRelayerUrl: relayUrl,
      readOnlyRpcUrl: rpc,
    };
    if (ipfsGateway && ipfsGateway.length) {
      opts.ipfsGatewayUrl = ipfsGateway;
    }
    return new ThirdwebSDK(rpc, opts);
  }, [relayUrl, rpc, ipfsGateway]);

  useEffect(() => {
    getSigner();
  }, [connector, data?.address, network.chain?.id]);

  useEffect(() => {
    if (!sdk || !Signer.isSigner(signer)) {
      return;
    }
    sdk.setProviderOrSigner(signer);
  }, [sdk, signer]);

  return sdk;
}
