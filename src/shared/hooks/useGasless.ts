import { useMemo } from "react";

export function useGasless(
  relayerUrl?: string,
  biconomyApiKey?: string,
  biconomyApiId?: string,
) {
  return useMemo(
    () =>
      relayerUrl
        ? {
            gasless: {
              openzeppelin: { relayerUrl },
            },
          }
        : biconomyApiKey && biconomyApiId
        ? {
            gasless: {
              biconomy: {
                apiKey: biconomyApiKey,
                apiId: biconomyApiId,
              },
            },
          }
        : undefined,
    [relayerUrl, biconomyApiKey, biconomyApiId],
  );
}
