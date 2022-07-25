import {
  Button,
  Center,
  ChakraProvider,
  Flex,
  Grid,
  Heading,
  Icon,
  Image,
  LightMode,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  Spinner,
  Stack,
  Text,
  useColorMode,
  useToast,
} from "@chakra-ui/react";
import { css, Global } from "@emotion/react";
import {
  ThirdwebProvider,
  useActiveClaimCondition,
  useAddress,
  useChainId,
  useClaimIneligibilityReasons,
  useClaimNFT,
  useEditionDrop,
  useNFT,
  useTotalCirculatingSupply,
} from "@thirdweb-dev/react";
import { EditionDrop, IpfsStorage } from "@thirdweb-dev/sdk";
import { BigNumber } from "ethers";
import { formatUnits, parseUnits } from "ethers/lib/utils";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { IoDiamondOutline } from "react-icons/io5";
import { ConnectWalletButton } from "../shared/connect-wallet-button";
import { Footer } from "../shared/footer";
import { Header } from "../shared/header";
import { DropSvg } from "../shared/svg/drop";
import chakraTheme from "../shared/theme";
import { fontsizeCss } from "../shared/theme/typography";
import { parseIneligibility } from "../utils/parseIneligibility";
import { parseIpfsGateway } from "../utils/parseIpfsGateway";

interface ClaimPageProps {
  contract?: EditionDrop;
  expectedChainId: number;
  tokenId: string;
  primaryColor: string;
  secondaryColor: string;
}

const ClaimButton: React.FC<ClaimPageProps> = ({
  contract,
  expectedChainId,
  tokenId,
  primaryColor,
  secondaryColor,
}) => {
  const address = useAddress();
  const chainId = useChainId();
  const [quantity, setQuantity] = useState(1);
  const loaded = useRef(false);
  const { data: totalSupply } = useTotalCirculatingSupply(contract, tokenId);

  const activeClaimCondition = useActiveClaimCondition(contract, tokenId);
  const claimIneligibilityReasons = useClaimIneligibilityReasons(
    contract,
    { quantity, walletAddress: address },
    tokenId,
  );
  const claimMutation = useClaimNFT(contract);

  const isEnabled = !!contract && !!address && chainId === expectedChainId;

  const bnPrice = parseUnits(
    activeClaimCondition.data?.currencyMetadata.displayValue || "0",
    activeClaimCondition.data?.currencyMetadata.decimals,
  );

  const priceToMint = bnPrice.mul(quantity);

  const isSoldOut =
    activeClaimCondition.data &&
    parseInt(activeClaimCondition.data?.availableSupply) === 0;

  const toast = useToast();

  const availableSupply = activeClaimCondition.data?.availableSupply;

  const quantityLimitPerTransaction =
    activeClaimCondition.data?.quantityLimitPerTransaction;

  const snapshot = activeClaimCondition.data?.snapshot;

  const useDefault = useMemo(
    () =>
      !snapshot ||
      snapshot?.find((user) => user.address === address)?.maxClaimable === "0",
    [snapshot, address],
  );

  const maxClaimable = useDefault
    ? isNaN(Number(quantityLimitPerTransaction))
      ? 1000
      : Number(quantityLimitPerTransaction)
    : Number(snapshot?.find((user) => user.address === address)?.maxClaimable);

  const lowerMaxClaimable = Math.min(
    maxClaimable,
    isNaN(Number(availableSupply)) ? 1000 : Number(availableSupply),
  );

  const claim = async () => {
    claimMutation.mutate(
      { to: address as string, tokenId, quantity },
      {
        onSuccess: () => {
          toast({
            title: "Successfully claimed.",
            status: "success",
            duration: 5000,
            isClosable: true,
          });
        },
        onError: (err) => {
          console.error(err);
          toast({
            title: "Failed to claim drop.",
            status: "error",
            duration: 9000,
            isClosable: true,
          });
        },
      },
    );
  };

  const isLoading = claimIneligibilityReasons.isLoading && !loaded.current;

  const canClaim =
    !isSoldOut && !!address && !claimIneligibilityReasons.data?.length;

  if (!isEnabled) {
    return (
      <ConnectWalletButton
        expectedChainId={expectedChainId}
        primaryColor={primaryColor}
        secondaryColor={secondaryColor}
      />
    );
  }

  const maxQuantity = activeClaimCondition.data?.maxQuantity;

  return (
    <Stack spacing={4} align="center" w="100%">
      <Flex w="100%" direction={{ base: "column", sm: "row" }} gap={2}>
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
          max={lowerMaxClaimable}
          maxW={{ base: "100%", sm: "100px" }}
          bgColor="inputBg"
        >
          <NumberInputField />
          <NumberInputStepper>
            <NumberIncrementStepper />
            <NumberDecrementStepper />
          </NumberInputStepper>
        </NumberInput>
        <LightMode>
          <Button
            isLoading={isLoading || claimMutation.isLoading}
            isDisabled={!canClaim}
            leftIcon={<IoDiamondOutline />}
            onClick={claim}
            w="full"
            colorScheme={primaryColor}
            fontSize={{ base: "label.md", md: "label.lg" }}
          >
            {isSoldOut
              ? "Sold out"
              : canClaim
              ? `Mint${quantity > 1 ? ` ${quantity}` : ""}${
                  activeClaimCondition.data?.price.eq(0)
                    ? " (Free)"
                    : activeClaimCondition.data?.currencyMetadata.displayValue
                    ? ` (${formatUnits(
                        priceToMint,
                        activeClaimCondition.data.currencyMetadata.decimals,
                      )} ${activeClaimCondition.data?.currencyMetadata.symbol})`
                    : ""
                }`
              : claimIneligibilityReasons.data?.length
              ? parseIneligibility(claimIneligibilityReasons.data, quantity)
              : "Minting Unavailable"}
          </Button>
        </LightMode>
      </Flex>
      {activeClaimCondition.data && (
        <Text size="label.md" color="green.500">
          {`${totalSupply || "0"} ${
            maxQuantity !== "unlimited"
              ? `/ ${(totalSupply || BigNumber.from(0)).add(
                  Number(availableSupply || 0),
                )}`
              : ""
          } claimed`}
        </Text>
      )}
    </Stack>
  );
};

const ClaimPage: React.FC<ClaimPageProps> = ({
  contract,
  expectedChainId,
  tokenId,
  primaryColor,
  secondaryColor,
}) => {
  const tokenMetadata = useNFT(contract, tokenId);

  if (tokenMetadata.isLoading) {
    return (
      <Center w="100%" h="100%">
        <Stack direction="row" align="center">
          <Spinner />
          <Heading size="label.sm">Loading...</Heading>
        </Stack>
      </Center>
    );
  }

  const metadata = tokenMetadata.data?.metadata;

  return (
    <Center w="100%" h="100%">
      <Flex direction="column" align="center" gap={4} w="100%">
        <Grid
          bg="#F2F0FF"
          border="1px solid rgba(0,0,0,.1)"
          borderRadius="20px"
          w="178px"
          h="178px"
          placeContent="center"
          overflow="hidden"
        >
          {metadata?.image ? (
            <Image
              objectFit="contain"
              w="100%"
              h="100%"
              src={metadata?.image}
              alt={metadata?.name}
            />
          ) : (
            <Icon maxW="100%" maxH="100%" as={DropSvg} />
          )}
        </Grid>
        <Heading fontSize={32} fontWeight="title" as="h1">
          {metadata?.name}
        </Heading>
        {metadata?.description && (
          <Text noOfLines={2} as="h2" fontSize={16}>
            {metadata.description}
          </Text>
        )}
        <ClaimButton
          contract={contract}
          tokenId={tokenId}
          expectedChainId={expectedChainId}
          primaryColor={primaryColor}
          secondaryColor={secondaryColor}
        />
      </Flex>
    </Center>
  );
};

interface BodyProps {
  children?: React.ReactNode;
}

const Body: React.FC<BodyProps> = ({ children }) => {
  return (
    <Flex as="main" px="28px" w="100%" flexGrow={1}>
      {children}
    </Flex>
  );
};

interface EditionDropEmbedProps {
  contractAddress: string;
  tokenId: string;
  expectedChainId: number;
  colorScheme: string;
  primaryColor: string;
  secondaryColor: string;
}

const EditionDropEmbed: React.FC<EditionDropEmbedProps> = ({
  contractAddress,
  tokenId,
  expectedChainId,
  colorScheme,
  primaryColor,
  secondaryColor,
}) => {
  const { setColorMode } = useColorMode();
  const editionDrop = useEditionDrop(contractAddress);
  const activeClaimCondition = useActiveClaimCondition(editionDrop, tokenId);
  const tokenAddress = activeClaimCondition?.data?.currencyAddress;

  useEffect(() => {
    setColorMode(colorScheme);
  }, [colorScheme, setColorMode]);

  return (
    <Flex
      position="fixed"
      top={0}
      left={0}
      bottom={0}
      right={0}
      flexDir="column"
      borderRadius="1rem"
      overflow="hidden"
      shadow="0px 1px 1px rgba(0,0,0,0.1)"
      border="1px solid"
      borderColor="borderColor"
      bgColor="backgroundHighlight"
    >
      <Header tokenAddress={tokenAddress} />
      <Body>
        <ClaimPage
          contract={editionDrop}
          tokenId={tokenId}
          expectedChainId={expectedChainId}
          primaryColor={primaryColor}
          secondaryColor={secondaryColor}
        />
      </Body>
      <Footer />
    </Flex>
  );
};

const urlParams = new URL(window.location.toString()).searchParams;

const App: React.FC = () => {
  const expectedChainId = Number(urlParams.get("chainId"));
  const contractAddress = urlParams.get("contract") || "";
  // default to expectedChainId default
  const rpcUrl = urlParams.get("rpcUrl") || "";
  const tokenId = urlParams.get("tokenId") || "0";
  const relayerUrl = urlParams.get("relayUrl") || "";

  const ipfsGateway = parseIpfsGateway(urlParams.get("ipfsGateway") || "");

  const colorScheme = urlParams.get("theme") || "light";
  const primaryColor = urlParams.get("primaryColor") || "blue";
  const secondaryColor = urlParams.get("secondaryColor") || "orange";

  const sdkOptions = useMemo(
    () =>
      relayerUrl
        ? {
            gasless: {
              openzeppelin: { relayerUrl },
            },
          }
        : undefined,
    [relayerUrl],
  );

  return (
    <>
      <Global
        styles={css`
          :host,
          :root {
            ${fontsizeCss};
          }
        `}
      />
      <ChakraProvider theme={chakraTheme}>
        <ThirdwebProvider
          desiredChainId={expectedChainId}
          sdkOptions={sdkOptions}
          storageInterface={
            ipfsGateway ? new IpfsStorage(ipfsGateway) : undefined
          }
          chainRpc={{ [expectedChainId]: rpcUrl }}
        >
          <EditionDropEmbed
            contractAddress={contractAddress}
            tokenId={tokenId}
            expectedChainId={expectedChainId}
            colorScheme={colorScheme}
            primaryColor={primaryColor}
            secondaryColor={secondaryColor}
          />
        </ThirdwebProvider>
      </ChakraProvider>
    </>
  );
};

const container = document.getElementById("root") as Element;
const root = createRoot(container);
root.render(<App />);
