import { AuctionListing, DirectListing, ListingType, MarketplaceModule, ThirdwebSDK } from "@3rdweb/sdk";
import { invariant } from "@3rdweb/sdk/dist/common/invariant";
import {
  Button,
  ButtonProps,
  Center,
  ChakraProvider,
  Flex,
  Grid,
  Heading,
  Icon,
  Image,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  Spinner,
  Stack,
  Tab,
  Text,
  useToast,
} from "@chakra-ui/react";
import { css, Global } from "@emotion/react";
import { BigNumber, ethers } from "ethers";
import React, { useEffect, useMemo, useRef, useState } from "react";
import ReactDOM from "react-dom";
import { IoDiamondOutline } from "react-icons/io5";
import {
  QueryClient,
  QueryClientProvider,
  useMutation,
  useQuery,
} from "react-query";
import { Provider, useNetwork } from "wagmi";
import { ConnectWalletButton } from "../shared/connect-wallet-button";
import { Footer } from "../shared/footer";
import { NftCarousel } from "../shared/nft-carousel";
import { DropSvg } from "../shared/svg/drop";
import chakraTheme from "../shared/theme";
import { fontsizeCss } from "../shared/theme/typography";
import { useFormatedValue } from "../shared/tokenHooks";
import { useAddress } from "../shared/useAddress";
import { useConnectors } from "../shared/useConnectors";
import { useSDKWithSigner } from "../shared/useSdkWithSigner";

interface MarketplaceWidgetProps {
  colorScheme?: "light" | "dark";
  rpcUrl?: string;
  contractAddress: string;
  expextedChainId: number;
}

interface BuyPageProps {
  module?: MarketplaceModule;
  sdk?: ThirdwebSDK;
  expextedChainId: number;
  listing: DirectListing | AuctionListing;
}

const DirectListing: React.FC<BuyPageProps> = ({
  module,
  sdk,
  expextedChainId,
  listing,
}) => {
  const [{ data: network }] = useNetwork();
  const address = useAddress();
  const chainId = useMemo(() => network?.chain?.id, [network]);
  const [quantity, setQuantity] = useState(1);
  const [buySuccess, setBuySuccess] = useState(false);

  const tokenModule = useMemo(() => {
    if (!listing.assetContractAddress || !sdk) {
      return undefined;
    }

    return sdk.getTokenModule(listing.assetContractAddress);
  }, [listing.assetContractAddress])

  const { data: currency, isLoading: isCurrencyLoading } = useQuery(
    ["currency"],
    async () => {
      invariant(sdk, "sdk must exist");
      invariant(tokenModule, "token module must exist");

      const currency = await tokenModule.get();
      return currency;
    },
    { enabled: !!sdk && !!listing.assetContractAddress && !!tokenModule },
  );

  const pricePerToken = ethers.utils.parseUnits(
    listing.buyoutCurrencyValuePerToken.value, 
    listing.buyoutCurrencyValuePerToken.decimals
  );

  const quantityLimit = useMemo(() => {
    return BigNumber.from(listing.quantity || 1);
  }, [listing.quantity]);


  const formatedPrice = useFormatedValue(
    listing.buyoutCurrencyValuePerToken.value,
    tokenModule,
    expextedChainId,
  );

  const toast = useToast();
  const isSoldOut = BigNumber.from(listing.quantity).eq(0);

  useEffect(() => {
    let t = setTimeout(() => setBuySuccess(false), 3000);
    return () => clearTimeout(t);
  }, [buySuccess]);


  const buyMutation = useMutation(
    () => {
      if (!address || !module) {
        throw new Error("No address or module");
      };

      return module.buyoutDirectListing({ 
        listingId: listing.id, 
        quantityDesired: quantity 
      });
    },
    {
      onSuccess: () => queryClient.invalidateQueries(),
      onError: (err) => {
        const anyErr = err as any;
        let message = "";

        if (anyErr.code === "INSUFFICIENT_FUNDS") {
          message = "Insufficient funds to purchase.";
        }

        toast({
          title: "Minting failed",
          description: message,
          status: "error",
          duration: 9000,
          isClosable: true,
        });
      },
    },
  );

  const canClaim = !isSoldOut && !!address;

  const showQuantityInput =
    canClaim &&
    quantityLimit.gt(1) &&
    quantityLimit.lte(1000);

  return (
    <Stack spacing={4} align="center" w="100%">
      {address && chainId === expextedChainId ? (
        <Flex w="100%" direction={{ base: "column", md: "row" }} gap={2}>
          {showQuantityInput && (
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
              maxW={{ base: "100%", md: "100px" }}
            >
              <NumberInputField />
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
          )}
          <Button
            fontSize={{ base: "label.md", md: "label.lg" }}
            isLoading={isCurrencyLoading}
            isDisabled={!canClaim}
            leftIcon={<IoDiamondOutline />}
            onClick={() => buyMutation.mutate()}
            isFullWidth
            colorScheme="blue"
          >
            {isSoldOut
              ? "Sold Out"
              : !!canClaim
              ? `Buy${showQuantityInput ? ` ${quantity}` : ""}${
                  pricePerToken.eq(0)
                    ? " (Free)"
                    : formatedPrice
                    ? ` (${formatedPrice})`
                    : ""
                }`
              : "Purchase Unavailable"}
          </Button>
        </Flex>
      ) : (
        <ConnectWalletButton expextedChainId={expextedChainId} />
      )}
    </Stack>
  );
};

const BuyPage: React.FC<BuyPageProps> = ({
  module,
  sdk,
  expextedChainId,
  listing,
}) => {
  const { data: metadata, isLoading } = useQuery(
    "module_metadata",
    async () => {
      const { assetContractAddress, tokenId } = listing;
      // This is not always NFT module but they should all have the get function
      const assetContract = sdk?.getNFTModule(assetContractAddress);
      const metadata = await assetContract?.get(tokenId.toString());
      return metadata;
    },
    { enabled: !!listing },
  );

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
        <Heading size="display.md" fontWeight="title" as="h1">
          {metadata?.name}
        </Heading>
        {metadata?.description && (
          <Heading noOfLines={2} as="h2" size="subtitle.md">
            {metadata.description}
          </Heading>
        )}
        {listing.type === ListingType.Direct && (
          <DirectListing
            module={module}
            expextedChainId={expextedChainId}
            sdk={sdk}
            listing={listing}
          />
        )}
      </Flex>
    </Center>
  );
};

const Body: React.FC = ({ children }) => {
  return (
    <Flex as="main" px="28px" w="100%" flexGrow={1}>
      {children}
    </Flex>
  );
};

interface MarketplaceWidgetProps {
  colorScheme?: "light" | "dark";
  rpcUrl?: string;
  relayUrl?: string;
  contractAddress: string;
  expextedChainId: number;
  listingId: string;
}

const MarketplaceWidget: React.FC<MarketplaceWidgetProps> = ({
  rpcUrl,
  relayUrl,
  contractAddress,
  expextedChainId,
  listingId,
}) => {
  const sdk = useSDKWithSigner({ rpcUrl, relayUrl, expextedChainId });

  const marketplaceModule = useMemo(() => {
    if (!sdk || !contractAddress) {
      return undefined;
    }
    return sdk.getMarketplaceModule(contractAddress);
  }, [sdk]);

  const { data: listing } = useQuery(
    ["numbers", "available"],
    () => marketplaceModule?.getListing(listingId),
    { enabled: !!marketplaceModule && !!listingId },
  );

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
      borderColor="blackAlpha.10"
      bg="whiteAlpha.100"
    >
      <Body>
        <BuyPage
          module={marketplaceModule}
          sdk={sdk}
          expextedChainId={expextedChainId}
          listing={listing as DirectListing | AuctionListing}
        />
      </Body>
      <Footer />
    </Flex>
  );
};

const queryClient = new QueryClient();
const urlParams = new URL(window.location.toString()).searchParams;

const App: React.FC = () => {
  const expextedChainId = Number(urlParams.get("chainId"));
  const contractAddress = urlParams.get("contract") || "";
  const rpcUrl = urlParams.get("rpcUrl") || ""; //default to expextedChainId default
  const listingId = urlParams.get("listingId") || "";
  const relayUrl = urlParams.get("relayUrl") || "";

  const connectors = useConnectors(expextedChainId, rpcUrl);

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
      <QueryClientProvider client={queryClient}>
        <ChakraProvider theme={chakraTheme}>
          <Provider autoConnect connectors={connectors}>
            <MarketplaceWidget
              rpcUrl={rpcUrl}
              contractAddress={contractAddress}
              expextedChainId={expextedChainId}
              listingId={listingId}
              relayUrl={relayUrl}
            />
          </Provider>
        </ChakraProvider>
      </QueryClientProvider>
    </>
  );
};

ReactDOM.render(<App />, document.getElementById("root"));
