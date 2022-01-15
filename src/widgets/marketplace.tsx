import { AuctionListing, DirectListing, ListingType, MarketplaceModule, ThirdwebSDK, TokenModule } from "@3rdweb/sdk";
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
  Input,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  Spinner,
  Stack,
  Tab,
  Text,
  Tooltip,
  useToast,
} from "@chakra-ui/react";
import { css, Global } from "@emotion/react";
import { BigNumber, BigNumberish, ethers } from "ethers";
import React, { useEffect, useMemo, useRef, useState } from "react";
import ReactDOM from "react-dom";
import { IoDiamondOutline } from "react-icons/io5";
import { AiFillExclamationCircle, AiFillInfoCircle } from "react-icons/ai";
import { RiAuctionLine } from "react-icons/ri";
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
import { useFormatedValue, useTokenModule, useTokenUnitConversion } from "../shared/tokenHooks";
import { useAddress } from "../shared/useAddress";
import { useConnectors } from "../shared/useConnectors";
import { useSDKWithSigner } from "../shared/useSdkWithSigner";

interface MarketplaceWidgetProps {
  colorScheme?: "light" | "dark";
  rpcUrl?: string;
  contractAddress: string;
  expectedChainId: number;
}

interface BuyPageProps {
  module?: MarketplaceModule;
  sdk?: ThirdwebSDK;
  expectedChainId: number;
  listing: DirectListing | AuctionListing;
}

interface AuctionListingProps extends BuyPageProps {
  listing: AuctionListing;
}

interface DirectListingProps extends BuyPageProps {
  listing: DirectListing;
}

const AuctionListing: React.FC<AuctionListingProps> = ({
  module,
  sdk, 
  expectedChainId,
  listing,
}) => {
  const toast = useToast();
  const address = useAddress();
  const [{ data: network }] = useNetwork();
  const tokenModule = useTokenModule(sdk, listing.currencyContractAddress);
  const chainId = useMemo(() => network?.chain?.id, [network]);
  const [bid, setBid] = useState("0");

  const isAuctionEnded = BigNumber
    .from(listing.endTimeInEpochSeconds)
    .toNumber() - (Date.now() / 1000) > 0

  const { data: currentBid } = useQuery(
    ["currentBid", listing.id],
    () => module?.getWinningBid(listing.id),
    { enabled: !!module },
  );

  const { data: auctionWinner } = useQuery(
    ["auctionWinner", listing.id],
    () => {
      if (isAuctionEnded) {
        return module?.getAuctionWinner(listing.id);
      }

      return undefined
    },
    { enabled: !!module },
  )

  const { data: bidBuffer } = useQuery(
    ["bidBuffer"],
    () => module?.getBidBufferBps(),
    { enabled: !!module },
  )

  const { minimumBidNumber, minimumBidBN } = useMemo(() => {
    if (!bidBuffer) {
      return { minimumBidNumber: "0", minimumBidBN: BigNumber.from(0) };
    };

    const currentBidBN = ethers.utils.parseUnits(
      currentBid?.currencyValue.value || "0", 
      currentBid?.currencyValue.decimals || 18  
    ).mul(BigNumber.from(10000).add(bidBuffer)).div(BigNumber.from(10000));

    const reservePriceBN = ethers.utils.parseUnits(
      listing.reservePriceCurrencyValuePerToken.value,
      listing.reservePriceCurrencyValuePerToken.decimals || 18,
    ).mul(listing.quantity);

    const currentBidNumber = ethers.utils.formatUnits(
      BigNumber.from(currentBid?.currencyValue.value || "0")
        .mul(BigNumber.from(10000).add(bidBuffer))
        .div(BigNumber.from(10000)), 
      currentBid?.currencyValue.decimals || 18
    );

    const reservePriceNumber = ethers.utils.formatUnits(
      BigNumber.from(listing.reservePriceCurrencyValuePerToken.value).mul(listing.quantity).toString(),
      listing.reservePriceCurrencyValuePerToken.decimals || 18,
    );

    const minimumBidBN = BigNumber
      .from(currentBid?.currencyValue.value || 0)
      .mul(BigNumber
      .from(10000)
      .add(bidBuffer))
      .div(BigNumber
      .from(10000));

    const minimumReservePriceBN = BigNumber
        .from(listing.reservePriceCurrencyValuePerToken.value || 0)
        .mul(listing.quantity);

    return currentBidBN.gt(reservePriceBN) 
      ? { minimumBidNumber: currentBidNumber, minimumBidBN } 
      : { minimumBidNumber: reservePriceNumber, minimumBidBN: minimumReservePriceBN };
  }, [
    currentBid?.currencyValue?.value, 
    currentBid?.currencyValue?.decimals, 
    listing.reservePriceCurrencyValuePerToken, 
    bidBuffer
  ]);

  const minimumBidFormatted = useFormatedValue(
    minimumBidBN,
    tokenModule,
    expectedChainId,
  );

  const currentBidFormatted = useFormatedValue(
    currentBid?.currencyValue.value,
    tokenModule,
    expectedChainId,
  );

  const buyoutPrice = useFormatedValue(
    BigNumber.from(listing.buyoutCurrencyValuePerToken.value).mul(listing.quantity),
    tokenModule,
    expectedChainId,
  );

  const remainingTime = useMemo(() => {
    const difference = BigNumber.from(listing.endTimeInEpochSeconds).toNumber() - Math.floor(Date.now() / 1000);
    const days = Math.floor(difference / (60 * 60 * 24));
    const hours = Math.floor((difference % (60 * 60 * 24)) / (60 * 60));
    const minutes = Math.floor((difference % (60 * 60)) / 60);

    return `${days ? `${days}d` : hours ? `${hours}h` : minutes ? `${minutes}m` : `ending now`}`;
  }, [listing.endTimeInEpochSeconds]);

  const endDateFormatted = useMemo(() => {
    const endDate = new Date(
      BigNumber.from(listing.endTimeInEpochSeconds).mul(1000).toNumber(),
    );

    if (endDate.toLocaleDateString() === new Date().toLocaleDateString()) {
      return `at ${endDate.toLocaleTimeString()}`;
    } 

    return `on ${endDate.toLocaleDateString()} at ${endDate.toLocaleTimeString()}`;
  }, [listing.endTimeInEpochSeconds])

  useEffect(() => {
    setBid(minimumBidNumber);
  }, [minimumBidNumber]);

  const bidMutation = useMutation(
    async () => {
      if (!module) {
        throw new Error("No module");
      }

      const pricePerToken = ethers.utils.parseUnits(
        bid.toString(), 
        currentBid?.currencyValue.decimals
      ).div(listing.quantity);

      return module.makeAuctionListingBid({
        listingId: listing.id,
        pricePerToken,
      });
    },
    {
      onSuccess: () => {
        toast({
          title: "Success",
          description: "You have successfully placed a bid on this listing",
          status: "success",
          duration: 5000,
          isClosable: true,
        });
        queryClient.invalidateQueries()
      },
      onError: (err) => {
        const anyErr = err as any;
        let message = "";

        if (anyErr.code === "INSUFFICIENT_FUNDS") {
          message = "Insufficient funds to purchase.";
        }

        toast({
          title: "Failed to place a bid on this auction",
          description: message,
          status: "error",
          duration: 9000,
          isClosable: true,
        });
      },
    }
  )

  const buyMutation = useMutation(
    () => {
      if (!module) {
        throw new Error("No module");
      }

      return module.buyoutAuctionListing(listing.id);
    },
    {
      onSuccess: () => {
        toast({
          title: "Success",
          description: "You have successfully purchased this listing",
          status: "success",
          duration: 5000,
          isClosable: true,
        });
        queryClient.invalidateQueries()
      },
      onError: (err) => {
        const anyErr = err as any;
        let message = "";

        if (anyErr.code === "INSUFFICIENT_FUNDS") {
          message = "Insufficient funds to purchase.";
        }

        toast({
          title: "Failed to buyout auction.",
          description: message,
          status: "error",
          duration: 9000,
          isClosable: true,
        });
      },
    }
  )

  return (
    <Stack spacing={4} align="center" w="100%">
      {address && chainId === expectedChainId ? (
        <Stack w="100%" spacing={0}>
          {isAuctionEnded ? (
            <>
              <Stack>
                <Flex w="100%">
                  <NumberInput
                    type="numeric"
                    width="100%"
                    borderRightRadius="0"
                    value={bid}
                    onChange={(valueString, value) => {
                      setBid(valueString || minimumBidNumber);
                    }}
                    min={parseFloat(minimumBidNumber)}
                  >
                    <NumberInputField width="100%" borderRightRadius={0} />
                  </NumberInput>
                  <Button
                    minW="120px"
                    borderLeftRadius="0"
                    fontSize={{ base: "label.md", md: "label.lg" }}
                    isLoading={bidMutation.isLoading}
                    leftIcon={<RiAuctionLine />}
                    colorScheme="blue"
                    onClick={() => bidMutation.mutate()}
                  >
                    Bid
                  </Button>
                </Flex>

                {BigNumber.from(listing.buyoutPrice).gt(0) && (
                  <Tooltip 
                    label={`
                      You can buyout this auction to instantly purchase 
                      all the listed assets and end the bidding process.
                    `}
                  >
                    <Button
                      minW="160px"
                      variant="outline"
                      fontSize={{ base: "label.md", md: "label.lg" }}
                      isLoading={buyMutation.isLoading}
                      leftIcon={<IoDiamondOutline />}
                      colorScheme="blue"
                      onClick={() => buyMutation.mutate()}
                    >
                      Buyout Auction ({buyoutPrice})
                    </Button>
                  </Tooltip>
                )}

                <Stack 
                  bg="blue.50" 
                  borderRadius="md" 
                  padding="12px" 
                  borderColor="blue.100" 
                  borderWidth="1px"
                  spacing={0}
                >
                  {currentBidFormatted ? (
                    <Text>
                      {currentBid?.buyerAddress && (
                        <>
                          {currentBid?.buyerAddress === address 
                          ? `You are currently the highest bidder ` 
                          : (
                            <>
                              The highest bidder is currently <strong>{currentBid?.buyerAddress}</strong>
                            </>
                          )}
                        </>
                      )}
                      with a bid of <strong>{currentBidFormatted}</strong>.
                    </Text>
                  ) : (
                    <Text color="gray.600" display="inline">
                      There are no bids in this auction yet.
                    </Text>
                  )}
                  <Text>
                    The minimum required to make a new bid is now&nbsp;
                    <strong>{minimumBidFormatted}</strong>.
                  </Text>
                </Stack>

                <Stack 
                  bg="orange.50" 
                  borderRadius="md" 
                  padding="12px" 
                  borderColor="orange.100" 
                  borderWidth="1px"
                  direction="row"
                >
                  <Icon color="orange.300" as={AiFillExclamationCircle} boxSize={6} />
                  <Text>
                    This auction closes {endDateFormatted} (<strong>{remainingTime}</strong>).
                  </Text>
                </Stack>
              </Stack>
            </>
          ) : (
            <>
              <Button
                width="100%"
                fontSize={{ base: "label.md", md: "label.lg" }}
                leftIcon={<IoDiamondOutline />}
                colorScheme="blue"
                isDisabled
              >
                Auction Ended
              </Button>
              {auctionWinner && (
                <Stack 
                  bg="blue.50" 
                  borderRadius="md" 
                  padding="12px" 
                  borderColor="blue.100" 
                  borderWidth="1px"
                  spacing={0}
                >
                  {auctionWinner === address ? (
                    <Text>
                      You won this auction! The auctioned assets have been transfered to your wallet.
                    </Text>
                  ) : (
                    <Text>
                      This auction was won by <strong>{auctionWinner}</strong>. 
                      If you made a bid, the bid has refunded to your wallet.
                    </Text>
                  )}
                </Stack>
              )}
            </>
          )}
        </Stack>
      ) : (
        <ConnectWalletButton expectedChainId={expectedChainId} />
      )}
    </Stack>
  );
}

const DirectListing: React.FC<DirectListingProps> = ({
  module,
  sdk,
  expectedChainId,
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

  const pricePerToken = ethers.utils.parseUnits(
    listing.buyoutCurrencyValuePerToken.value, 
    listing.buyoutCurrencyValuePerToken.decimals
  );

  const quantityLimit = useMemo(() => {
    return BigNumber.from(listing.quantity || 1);
  }, [listing.quantity]);

  const formatedPrice = useFormatedValue(
    BigNumber.from(listing.buyoutCurrencyValuePerToken.value).mul(BigNumber.from(quantity)),
    tokenModule,
    expectedChainId,
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
      onSuccess: () => {
        toast({
          title: "Success",
          description: "You have successfully purchased from this listing",
          status: "success",
          duration: 5000,
          isClosable: true,
        });
        queryClient.invalidateQueries()
      },
      onError: (err) => {
        const anyErr = err as any;
        let message = "";

        if (anyErr.code === "INSUFFICIENT_FUNDS") {
          message = "Insufficient funds to purchase.";
        }

        toast({
          title: "Failed to purchase from listing",
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
      {!isSoldOut && (        
        <Text>
          <strong>Available: </strong>
          {BigNumber.from(listing.quantity).toString()}
        </Text>
      )}
      {address && chainId === expectedChainId ? (
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
            isLoading={buyMutation.isLoading}
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
                  BigNumber.from(pricePerToken).eq(0)
                    ? " (Free)"
                    : formatedPrice
                    ? ` (${formatedPrice})`
                    : ""
                }`
              : "Purchase Unavailable"}
          </Button>
        </Flex>
      ) : (
        <ConnectWalletButton expectedChainId={expectedChainId} />
      )}
    </Stack>
  );
};

const BuyPage: React.FC<BuyPageProps> = ({
  module,
  sdk,
  expectedChainId,
  listing,
}) => {
  if (!listing) {
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
          {listing?.asset?.image ? (
            <Image
              objectFit="contain"
              w="100%"
              h="100%"
              src={listing?.asset?.image.replace("ipfs://", "https://cloudflare-ipfs.com/ipfs/")}
              alt={listing?.asset?.name}
            />
          ) : (
            <Icon maxW="100%" maxH="100%" as={DropSvg} />
          )}
        </Grid>
        <Heading size="display.md" fontWeight="title" as="h1">
          {listing?.asset?.name}
        </Heading>
        {listing?.asset?.description && (
          <Heading noOfLines={2} as="h2" size="subtitle.md">
            {listing?.asset?.description}
          </Heading>
        )}
        {listing?.type === ListingType.Direct ? (
          <DirectListing
            module={module}
            expectedChainId={expectedChainId}
            sdk={sdk}
            listing={listing}
          />
        ) : (
          <AuctionListing 
            module={module}
            expectedChainId={expectedChainId}
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
  expectedChainId: number;
  listingId: string;
}

const MarketplaceWidget: React.FC<MarketplaceWidgetProps> = ({
  rpcUrl,
  relayUrl,
  contractAddress,
  expectedChainId,
  listingId,
}) => {
  const sdk = useSDKWithSigner({ rpcUrl, relayUrl, expectedChainId });

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
          expectedChainId={expectedChainId}
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
  const expectedChainId = Number(urlParams.get("chainId"));
  const contractAddress = urlParams.get("contract") || "";
  const rpcUrl = urlParams.get("rpcUrl") || ""; //default to expectedChainId default
  const listingId = urlParams.get("listingId") || "";
  const relayUrl = urlParams.get("relayUrl") || "";

  const connectors = useConnectors(expectedChainId, rpcUrl);

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
              expectedChainId={expectedChainId}
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
