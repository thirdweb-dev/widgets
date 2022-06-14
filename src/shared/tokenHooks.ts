import { AddressZero } from "@ethersproject/constants";
import { NATIVE_TOKENS, SUPPORTED_CHAIN_ID, Token } from "@thirdweb-dev/sdk";
import { BigNumber, BigNumberish } from "ethers";
import { formatUnits, isAddress } from "ethers/lib/utils";
import { useCallback, useEffect, useState } from "react";

export const OtherAddressZero = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";

export function isAddressZero(address: string): boolean {
  const lowerCaseAddress = (address || "").toLowerCase();

  return (
    isAddress(lowerCaseAddress) &&
    (lowerCaseAddress === AddressZero.toLowerCase() ||
      lowerCaseAddress === OtherAddressZero.toLowerCase())
  );
}

export function useTokenUnitConversion(tokenContract?: Token) {
  const format = useCallback(
    async (value: BigNumberish, chainId?: number) => {
      value = BigNumber.from(value);
      const nativeCurrency = chainId
        ? ` ${NATIVE_TOKENS[chainId as SUPPORTED_CHAIN_ID].symbol}`
        : "";

      // invalid token address
      if (isAddressZero(tokenContract?.getAddress() || "")) {
        // default to 18 decimals

        return formatUnits(value.toString(), 18) + nativeCurrency;
      }

      try {
        const contractData = await tokenContract?.get();
        if (contractData?.decimals) {
          return `${formatUnits(value.toString(), contractData.decimals)} ${
            contractData.symbol
          }`;
        }
        return formatUnits(value.toString(), 18) + nativeCurrency;
      } catch (e) {
        return formatUnits(value.toString(), 18) + nativeCurrency;
      }
    },
    [tokenContract],
  );

  return { format };
}

export function useFormattedValue(
  value?: BigNumberish,
  tokenContract?: Token,
  chainId?: number,
) {
  const [formatted, setFormatted] = useState<string | undefined>();
  const { format } = useTokenUnitConversion(tokenContract);
  useEffect(() => {
    if (!value) {
      return;
    }

    format(value, chainId).then(setFormatted);
  }, [format, value, chainId]);

  return formatted;
}
