import {
  Button,
  Center,
  ChakraProvider,
  ColorMode,
  Flex,
  Heading,
  Icon,
  LightMode,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  Spinner,
  Stack,
  Text,
  Tooltip,
  useColorMode,
  useToast,
} from "@chakra-ui/react";
import { css, Global } from "@emotion/react";
import {
  ThirdwebProvider,
  useAddress,
  useAuctionWinner,
  useBidBuffer,
  useContract,
  useDirectListing,
  useListing,
  useWinningBid,
  Web3Button,
} from "@thirdweb-dev/react";
import {
  AuctionListing,
  DirectListing,
  ListingType,
  Marketplace,
  MarketplaceV3,
} from "@thirdweb-dev/sdk";
import { DirectListingV3 } from "@thirdweb-dev/sdk/dist/declarations/src/evm/types/marketplacev3";
import { ThirdwebStorage } from "@thirdweb-dev/storage";
import { BigNumber, utils } from "ethers";
import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { AiFillExclamationCircle } from "react-icons/ai";
import { IoDiamondOutline } from "react-icons/io5";
import { Body } from "src/shared/body";
import { Header } from "src/shared/header";
import { TokenMetadataPage } from "src/shared/token-metadata-page";
import { Footer } from "../shared/footer";
import { useGasless } from "../shared/hooks/useGasless";
import chakraTheme from "../shared/theme";
import { fontsizeCss } from "../shared/theme/typography";
import { parseIpfsGateway } from "../utils/parseIpfsGateway";

interface MarketplaceEmbedProps {
  rpcUrl?: string;
  contractAddress: string;
  listingId: string;
  colorScheme: ColorMode;
  primaryColor: string;
  secondaryColor: string;
}

interface BuyPageProps {
  contract?: MarketplaceV3;
  listing: DirectListingV3;
  isLoading?: boolean;
  primaryColor: string;
  secondaryColor: string;
  colorScheme: ColorMode;
}

interface DirectListingProps extends BuyPageProps {
  listing: DirectListingV3;
}

const DirectListingComponent: React.FC<DirectListingProps> = ({
  contract,
  listing,
  primaryColor,
  colorScheme,
}) => {
  const address = useAddress();
  const [quantity, setQuantity] = useState(1);
  const [buySuccess, setBuySuccess] = useState(false);

  const pricePerToken = listing.currencyValuePerToken.value;

  const quantityLimit = useMemo(() => {
    return BigNumber.from(listing.quantity || 1);
  }, [listing.quantity]);

  const formattedPrice = useMemo(() => {
    if (!listing.currencyValuePerToken || !quantity) {
      return undefined;
    }
    const formatted = BigNumber.from(
      listing.currencyValuePerToken.value,
    ).mul(BigNumber.from(quantity));

    return `${utils.formatUnits(
      formatted,
      listing.currencyValuePerToken.decimals,
    )} ${listing.currencyValuePerToken.symbol}`;
  }, [listing.currencyValuePerToken, quantity]);

  const toast = useToast();
  const isSoldOut = BigNumber.from(listing.quantity).eq(0);

  useEffect(() => {
    const t = setTimeout(() => setBuySuccess(false), 3000);
    return () => clearTimeout(t);
  }, [buySuccess]);

  const canClaim = !isSoldOut && !!address;

  const showQuantityInput =
    canClaim && quantityLimit.gt(1) && quantityLimit.lte(1000);

  const colors = chakraTheme.colors;
  const accentColor = colors[primaryColor as keyof typeof colors][500];

  return (
    <Stack spacing={4} align="center" w="100%">
      {!isSoldOut && (
        <Text>
          <strong>Available: </strong>
          {BigNumber.from(listing.quantity).toString()}
        </Text>
      )}
      <Flex
        w="100%"
        direction={{ base: "column", sm: "row" }}
        gap={2}
        justifyContent="center"
        alignItems="center"
      >
        {showQuantityInput && !isSoldOut && (
          <NumberInput
            inputMode="numeric"
            value={quantity}
            onChange={(stringValue, value) => {
              if (stringValue === "") {
                setQuantity(0);
              } else {
                setQuantity(value);
              }
            }}
            min={1}
            max={quantityLimit.toNumber()}
            maxW={{ base: "100%", sm: "100px" }}
          >
            <NumberInputField />
            <NumberInputStepper>
              <NumberIncrementStepper />
              <NumberDecrementStepper />
            </NumberInputStepper>
          </NumberInput>
        )}
        <LightMode>
          <Web3Button
            contractAddress={contract?.getAddress() || ""}
            accentColor={accentColor}
            colorMode={colorScheme}
            isDisabled={!canClaim}
            action={() => contract?.directListings.buyFromListing(listing.id, quantity)}
            onSuccess={() => {
              toast({
                title: "Success",
                description:
                  "You have successfully purchased from this listing",
                status: "success",
                duration: 5000,
                isClosable: true,
              });
            }}
            onError={(err) => {
              console.error(err);
              toast({
                title: "Failed to purchase from listing",
                status: "error",
                duration: 9000,
                isClosable: true,
              });
            }}
          >
            {isSoldOut
              ? "Sold Out"
              : canClaim
              ? `Buy${showQuantityInput ? ` ${quantity}` : ""}${
                  BigNumber.from(pricePerToken).eq(0)
                    ? " (Free)"
                    : formattedPrice
                    ? ` (${formattedPrice})`
                    : ""
                }`
              : "Purchase Unavailable"}
          </Web3Button>
        </LightMode>
      </Flex>
    </Stack>
  );
};

const BuyPage: React.FC<BuyPageProps> = ({
  contract,
  listing,
  isLoading,
  primaryColor,
  secondaryColor,
  colorScheme,
}) => {
  if (isLoading) {
    return (
      <Center w="100%" h="100%">
        <Stack direction="row" align="center">
          <Spinner />
          <Heading size="label.sm">Loading...</Heading>
        </Stack>
      </Center>
    );
  }

  if (!listing) {
    return (
      <Center w="100%" h="100%">
        <Button colorScheme="primary" w="100%" isDisabled>
          This listing was either cancelled or does not exist.
        </Button>
      </Center>
    );
  }

  return (
    <Center w="100%" h="100%">
      <Flex direction="column" align="center" gap={4} w="100%">
          <DirectListingComponent
            contract={contract}
            listing={listing}
            primaryColor={primaryColor}
            secondaryColor={secondaryColor}
            colorScheme={colorScheme}
          />
      </Flex>
    </Center>
  );
};
const MarketplaceEmbed: React.FC<MarketplaceEmbedProps> = ({
  contractAddress,
  listingId,
  colorScheme,
  primaryColor,
  secondaryColor,
}) => {
  const { setColorMode } = useColorMode();
  const marketplace = useContract(contractAddress, "marketplace-v3").contract;

  const { data: listing, isLoading } = useDirectListing(marketplace, listingId);
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
      <Header primaryColor={primaryColor} colorScheme={colorScheme} />
      <Body>
        <TokenMetadataPage metadata={listing?.asset} isLoading={isLoading}>
          <BuyPage
            contract={marketplace}
            listing={listing as DirectListingV3}
            isLoading={isLoading}
            primaryColor={primaryColor}
            secondaryColor={secondaryColor}
            colorScheme={colorScheme}
          />
        </TokenMetadataPage>
      </Body>
      <Footer />
    </Flex>
  );
};

const urlParams = new URL(window.location.toString()).searchParams;

const App: React.FC = () => {
  const chainId = Number(urlParams.get("chainId"));
  const contractAddress = urlParams.get("contract") || "";
  const rpcUrl = urlParams.get("rpcUrl") || "";
  const listingId = urlParams.get("listingId") || "";
  const relayerUrl = urlParams.get("relayUrl") || "";
  const biconomyApiKey = urlParams.get("biconomyApiKey") || "";
  const biconomyApiId = urlParams.get("biconomyApiId") || "";
  const colorScheme = urlParams.get("theme") === "dark" ? "dark" : "light";
  const primaryColor = urlParams.get("primaryColor") || "purple";
  const secondaryColor = urlParams.get("secondaryColor") || "orange";

  const ipfsGateway = parseIpfsGateway(urlParams.get("ipfsGateway") || "");

  const sdkOptions = useGasless(relayerUrl, biconomyApiKey, biconomyApiId);

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
          desiredChainId={chainId}
          sdkOptions={sdkOptions}
          storageInterface={
            ipfsGateway
              ? new ThirdwebStorage({
                  gatewayUrls: {
                    "ipfs://": [ipfsGateway],
                  },
                })
              : undefined
          }
          chainRpc={rpcUrl ? { [chainId]: rpcUrl } : undefined}
        >
          <MarketplaceEmbed
            contractAddress={contractAddress}
            listingId={listingId}
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
