import {
  ColorMode,
  Flex,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  Skeleton,
  Spinner,
  Stack,
  Text,
  useToast,
} from "@chakra-ui/react";
import {
  useActiveClaimCondition,
  useAddress,
  useClaimIneligibilityReasons,
  useTotalCirculatingSupply,
  Web3Button,
} from "@thirdweb-dev/react";
import type { EditionDrop } from "@thirdweb-dev/sdk";
import { BigNumber, BigNumberish, utils } from "ethers";
import React, { useMemo, useState } from "react";
import { parseIneligibility } from "../utils/parseIneligibility";
import { useDebounce } from "./hooks/useDebounce";
import chakraTheme from "./theme";

interface ClaimButtoProps {
  contract?: EditionDrop;
  tokenId: BigNumberish;
  primaryColor: string;
  colorScheme: ColorMode;
}

export const ERC1155ClaimButton: React.FC<ClaimButtoProps> = ({
  contract,
  primaryColor,
  tokenId,
  colorScheme,
}) => {
  const address = useAddress();
  const [quantity, setQuantity] = useState(1);
  const toast = useToast();

  const debouncedQuantity = useDebounce(quantity, 500);

  const activeClaimCondition = useActiveClaimCondition(contract, tokenId);

  const claimIneligibilityReasons = useClaimIneligibilityReasons(
    contract,
    {
      quantity: debouncedQuantity,
      walletAddress: address || "",
    },
    tokenId,
  );

  const claimedSupply = useTotalCirculatingSupply(contract, tokenId);

  const totalAvailableSupply = useMemo(() => {
    try {
      return BigNumber.from(activeClaimCondition.data?.availableSupply || 0);
    } catch {
      return BigNumber.from(1_000_000);
    }
  }, [activeClaimCondition.data?.availableSupply]);

  const numberClaimed = useMemo(() => {
    return BigNumber.from(claimedSupply.data || 0).toString();
  }, [claimedSupply]);

  const numberTotal = useMemo(() => {
    const n = totalAvailableSupply;
    if (n.gte(1_000_000)) {
      return "Unlimited";
    }
    return n.toString();
  }, [totalAvailableSupply]);

  const priceToMint = useMemo(() => {
    const bnPrice = BigNumber.from(
      activeClaimCondition.data?.currencyMetadata.value || 0,
    );
    return `${utils.formatUnits(
      bnPrice.mul(quantity).toString(),
      activeClaimCondition.data?.currencyMetadata.decimals || 18,
    )} ${activeClaimCondition.data?.currencyMetadata.symbol}`;
  }, [
    activeClaimCondition.data?.currencyMetadata.decimals,
    activeClaimCondition.data?.currencyMetadata.symbol,
    activeClaimCondition.data?.currencyMetadata.value,
    quantity,
  ]);

  const maxClaimable = useMemo(() => {
    let bnMaxClaimable;
    try {
      bnMaxClaimable = BigNumber.from(
        activeClaimCondition.data?.maxQuantity || 0,
      );
    } catch (e) {
      bnMaxClaimable = BigNumber.from(1_000_000);
    }

    let perTransactionClaimable;
    try {
      perTransactionClaimable = BigNumber.from(
        activeClaimCondition.data?.quantityLimitPerTransaction || 0,
      );
    } catch (e) {
      perTransactionClaimable = BigNumber.from(1_000_000);
    }

    if (perTransactionClaimable.lte(bnMaxClaimable)) {
      bnMaxClaimable = perTransactionClaimable;
    }

    const snapshotClaimable = activeClaimCondition.data?.snapshot?.find(
      (u) => u.address === address,
    )?.maxClaimable;

    if (snapshotClaimable) {
      if (snapshotClaimable === "0") {
        // allowed unlimited for the snapshot
        bnMaxClaimable = BigNumber.from(1_000_000);
      } else {
        try {
          bnMaxClaimable = BigNumber.from(snapshotClaimable);
        } catch (e) {
          // fall back to default case
        }
      }
    }

    const maxAvailable = BigNumber.from(totalAvailableSupply).sub(
      claimedSupply.data || 0,
    );

    let max;
    if (maxAvailable.lt(bnMaxClaimable)) {
      max = maxAvailable;
    } else {
      max = bnMaxClaimable;
    }

    if (max.gte(1_000_000)) {
      return 1_000_000;
    }
    return max.toNumber();
  }, [
    activeClaimCondition.data?.maxQuantity,
    activeClaimCondition.data?.quantityLimitPerTransaction,
    activeClaimCondition.data?.snapshot,
    address,
    claimedSupply.data,
    totalAvailableSupply,
  ]);
  const isSoldOut = useMemo(() => {
    try {
      return (
        (activeClaimCondition.isSuccess &&
          BigNumber.from(activeClaimCondition.data?.availableSupply || 0).lte(
            0,
          )) ||
        numberClaimed === numberTotal
      );
    } catch (e) {
      return false;
    }
  }, [
    activeClaimCondition.data?.availableSupply,
    activeClaimCondition.isSuccess,
    numberClaimed,
    numberTotal,
  ]);

  const canClaim = useMemo(() => {
    return (
      activeClaimCondition.isSuccess &&
      claimIneligibilityReasons.isSuccess &&
      claimIneligibilityReasons.data?.length === 0 &&
      !isSoldOut
    );
  }, [
    activeClaimCondition.isSuccess,
    claimIneligibilityReasons.data?.length,
    claimIneligibilityReasons.isSuccess,
    isSoldOut,
  ]);

  const isLoading = useMemo(() => {
    return (
      activeClaimCondition.isLoading || claimedSupply.isLoading || !contract
    );
  }, [activeClaimCondition.isLoading, contract, claimedSupply.isLoading]);

  const buttonLoading = useMemo(
    () => isLoading || claimIneligibilityReasons.isLoading,
    [claimIneligibilityReasons.isLoading, isLoading],
  );
  const buttonText = useMemo(() => {
    if (isSoldOut) {
      return "Sold Out";
    }

    if (canClaim) {
      const pricePerToken = BigNumber.from(
        activeClaimCondition.data?.currencyMetadata.value || 0,
      );
      if (pricePerToken.eq(0)) {
        return "Mint (Free)";
      }
      return `Mint (${priceToMint})`;
    }
    if (claimIneligibilityReasons.data?.length) {
      return parseIneligibility(claimIneligibilityReasons.data, quantity);
    }
    if (buttonLoading) {
      return "Checking eligibility...";
    }

    return "Claiming not available";
  }, [
    isSoldOut,
    canClaim,
    claimIneligibilityReasons.data,
    buttonLoading,
    activeClaimCondition.data?.currencyMetadata.value,
    priceToMint,
    quantity,
  ]);

  const colors = chakraTheme.colors;
  const accentColor = colors[primaryColor as keyof typeof colors][500];

  if (activeClaimCondition.isError) {
    return (
      <Text size="label.md" color="red.500">
        This drop is not ready to be minted yet. (No claim condition set)
      </Text>
    );
  }

  return (
    <Stack spacing={4} align="center" w="100%">
      <Flex
        w="100%"
        direction={{ base: "column", sm: "row" }}
        gap={2}
        justifyContent="center"
        alignItems="center"
      >
        {!isSoldOut && (
          <Skeleton isLoaded={!isLoading}>
            <NumberInput
              inputMode="numeric"
              value={quantity}
              onChange={(stringValue, value) => {
                if (stringValue === "") {
                  setQuantity(1);
                } else {
                  setQuantity(value);
                }
              }}
              min={1}
              max={maxClaimable}
              maxW={{ base: "100%", sm: "100px" }}
              bgColor="inputBg"
              height="full"
            >
              <NumberInputField />
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
          </Skeleton>
        )}
        <Web3Button
          colorMode={colorScheme}
          contractAddress={contract?.getAddress() || ""}
          action={(cntr) => cntr.erc1155.claim(tokenId, quantity)}
          isDisabled={!canClaim || buttonLoading}
          accentColor={accentColor}
          onError={(err) => {
            console.error(err);
            toast({
              title: "Failed to mint drop.",
              status: "error",
              duration: 9000,
              isClosable: true,
            });
          }}
          onSuccess={() => {
            toast({
              title: "Successfully minted.",
              status: "success",
              duration: 5000,
              isClosable: true,
            });
          }}
        >
          {buttonLoading ? <Spinner size="sm" /> : buttonText}
        </Web3Button>
      </Flex>

      <Text size="label.md" color="green.500">
        <Skeleton as="span" isLoaded={!isLoading}>
          {isLoading ? "00" : numberClaimed}
        </Skeleton>{" "}
        /{" "}
        <Skeleton as="span" isLoaded={!isLoading}>
          {isLoading ? "00" : numberTotal}
        </Skeleton>{" "}
        minted
      </Text>
    </Stack>
  );
};
