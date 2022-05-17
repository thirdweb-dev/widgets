import { AddressZero } from "@ethersproject/constants";
import { Token } from "@thirdweb-dev/sdk";
import { BigNumber, BigNumberish } from "ethers";
import { formatUnits, isAddress } from "ethers/lib/utils";
import { useCallback, useEffect, useState } from "react";
import { ChainIDToNativeSymbol } from "./commonRPCUrls";

export const OtherAddressZero = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";

export function isAddressZero(address: string): boolean {
  const lowerCaseAddress = (address || "").toLowerCase();

  return (
    isAddress(lowerCaseAddress) &&
    (lowerCaseAddress === AddressZero.toLowerCase() ||
      lowerCaseAddress === OtherAddressZero.toLowerCase())
  );
}

export function useTokenUnitConversion(tokenModule?: Token) {
  const format = useCallback(
    async (value: BigNumberish, chainId?: number) => {
      value = BigNumber.from(value);
      const nativeCurrency = chainId
        ? ` ${ChainIDToNativeSymbol[chainId]}`
        : "";

      // invalid token address
      if (isAddressZero(tokenModule?.getAddress() || "")) {
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
  tokenModule?: Token,
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
