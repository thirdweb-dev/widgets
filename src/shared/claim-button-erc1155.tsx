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
  DropContract,
  useActiveClaimConditionForWallet,
  useAddress,
  useClaimConditions,
  useClaimerProofs,
  useClaimIneligibilityReasons,
  useTotalCirculatingSupply,
  Web3Button,
} from "@thirdweb-dev/react";
import type { NFTDrop, SignatureDrop, TokenDrop } from "@thirdweb-dev/sdk";
import { BigNumber, BigNumberish, utils } from "ethers";
import React, { useMemo, useState } from "react";
import { parseIneligibility } from "../utils/parseIneligibility";
import { useDebounce } from "./hooks/useDebounce";
import chakraTheme from "./theme";

interface ClaimButtonProps {
  contract?: Exclude<DropContract, TokenDrop | SignatureDrop | NFTDrop>;
  tokenId: BigNumberish;
  primaryColor: string;
  colorScheme: "light" | "dark";
}

export const ERC1155ClaimButton: React.FC<ClaimButtonProps> = ({
  contract,
  primaryColor,
  tokenId,
  colorScheme,
}) => {
  const address = useAddress();
  const [quantity, setQuantity] = useState(1);
  const toast = useToast();

  const debouncedQuantity = useDebounce(quantity, 500);

  const claimConditions = useClaimConditions(contract);
  const activeClaimCondition = useActiveClaimConditionForWallet(
    contract,
    address,
    tokenId,
  );
  const claimerProofs = useClaimerProofs(contract, address || "", tokenId);
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
    const n = totalAvailableSupply.add(BigNumber.from(claimedSupply.data || 0));
    if (n.gte(1_000_000)) {
      return "";
    }
    return n.toString();
  }, [totalAvailableSupply, claimedSupply]);

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
        activeClaimCondition.data?.maxClaimableSupply || 0,
      );
    } catch (e) {
      bnMaxClaimable = BigNumber.from(1_000_000);
    }

    let perTransactionClaimable;
    try {
      perTransactionClaimable = BigNumber.from(
        activeClaimCondition.data?.maxClaimablePerWallet || 0,
      );
    } catch (e) {
      perTransactionClaimable = BigNumber.from(1_000_000);
    }

    if (perTransactionClaimable.lte(bnMaxClaimable)) {
      bnMaxClaimable = perTransactionClaimable;
    }

    const snapshotClaimable = claimerProofs.data?.maxClaimable;

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

    let max;
    if (totalAvailableSupply.lt(bnMaxClaimable)) {
      max = totalAvailableSupply;
    } else {
      max = bnMaxClaimable;
    }

    if (max.gte(1_000_000)) {
      return 1_000_000;
    }
    return max.toNumber();
  }, [
    claimerProofs.data?.maxClaimable,
    totalAvailableSupply,
    activeClaimCondition.data?.maxClaimableSupply,
    activeClaimCondition.data?.maxClaimablePerWallet,
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

    return "Minting not available";
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

  if (
    claimConditions.data?.length === 0 ||
    claimConditions.data?.every((cc) => cc.maxClaimableSupply === "0")
  ) {
    return (
      <Text size="label.md" color="red.500">
        This drop is not ready to be minted yet. (No claim condition set)
      </Text>
    );
  }

  if (
    (claimConditions.data &&
      claimConditions.data.length > 0 &&
      activeClaimCondition.isError) ||
    (activeClaimCondition.data &&
      activeClaimCondition.data.startTime > new Date())
  ) {
    return (
      <Text size="label.md" color={`${primaryColor}.500`}>
        Drop is starting soon. Please check back later.
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
          theme={colorScheme}
          contractAddress={contract?.getAddress() || ""}
          action={(cntr) => cntr.erc1155.claim(tokenId, quantity)}
          isDisabled={!canClaim || buttonLoading}
          style={{
            backgroundColor: accentColor,
          }}
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
        {numberTotal !== "" && "/ "}
        <Skeleton as="span" isLoaded={!isLoading}>
          {isLoading ? "00" : numberTotal}
        </Skeleton>{" "}
        minted
      </Text>
    </Stack>
  );
};
