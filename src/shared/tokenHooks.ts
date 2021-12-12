import { CurrencyModule } from "@3rdweb/sdk";
import { AddressZero } from "@ethersproject/constants";
import { BigNumber, BigNumberish } from "ethers";
import { formatUnits, isAddress } from "ethers/lib/utils";
import { useCallback, useEffect, useState } from "react";
import { ChainIDToNativeSymbol } from "./commonRPCUrls";

export function isAddressZero(address: string): boolean {
  return isAddress(address) && address === AddressZero;
}

export function useTokenUnitConversion(tokenModule?: CurrencyModule) {
  const format = useCallback(
    async (value: BigNumberish, chainId?: number) => {
      value = BigNumber.from(value);
      const nativeCurrency = chainId
        ? ` ${ChainIDToNativeSymbol[chainId]}`
        : "";

      // invalid token address
      if (
        !isAddress(tokenModule?.address || "") ||
        isAddressZero(tokenModule?.address || "")
      ) {
        // default to 18 decimals
        return formatUnits(value.toString(), 18) + nativeCurrency;
      }

      try {
        const moduleData = await tokenModule?.get();
        if (moduleData?.decimals) {
          return `${formatUnits(value.toString(), moduleData.decimals)} ${
            moduleData.symbol
          }`;
        }
        return formatUnits(value.toString(), 18) + nativeCurrency;
      } catch (e) {
        return formatUnits(value.toString(), 18) + nativeCurrency;
      }
    },
    [tokenModule],
  );

  return { format };
}

export function useFormatedValue(
  value?: BigNumberish,
  tokenModule?: CurrencyModule,
  chainId?: number,
) {
  const [formatted, setFormatted] = useState<string | undefined>();
  const { format } = useTokenUnitConversion(tokenModule);
  useEffect(() => {
    if (!value) {
      return;
    }

    format(value, chainId).then(setFormatted);
  }, [format, value, chainId]);
  return formatted;
}
