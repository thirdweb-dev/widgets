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
  useListing,
  useWinningBid,
  Web3Button,
} from "@thirdweb-dev/react";
import {
  AuctionListing,
  DirectListing,
  ListingType,
  Marketplace,
} from "@thirdweb-dev/sdk";
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
  colorScheme: "light" | "dark";
  primaryColor: string;
  secondaryColor: string;
}

interface BuyPageProps {
  contract?: Marketplace;
  listing: DirectListing | AuctionListing;
  isLoading?: boolean;
  primaryColor: string;
  secondaryColor: string;
  colorScheme: "light" | "dark";
}

interface AuctionListingProps extends BuyPageProps {
  listing: AuctionListing;
}

interface DirectListingProps extends BuyPageProps {
  listing: DirectListing;
}

const AuctionListingComponent: React.FC<AuctionListingProps> = ({
  contract,
  listing,
  primaryColor,
  secondaryColor,
  colorScheme,
}) => {
  const toast = useToast();
  const address = useAddress();
  const [bid, setBid] = useState("0");

  const isAuctionEnded = useMemo(() => {
    const endTime = BigNumber.from(listing.endTimeInEpochSeconds);
    const currentTime = BigNumber.from(Math.floor(Date.now() / 1000));

    return endTime.sub(currentTime).lte(0);
  }, [listing.endTimeInEpochSeconds]);

  const { data: winningBid } = useWinningBid(contract, listing.id);
  const { data: auctionWinner } = useAuctionWinner(contract, listing.id);
  const { data: bidBuffer } = useBidBuffer(contract);

  const valuesFormatted = useMemo(() => {
    let mimimumBidNumber = BigNumber.from(winningBid?.currencyValue?.value || 0)
      .mul(BigNumber.from(10000).add(bidBuffer || 0))
      .div(BigNumber.from(10000));
    if (mimimumBidNumber.eq(0)) {
      mimimumBidNumber = BigNumber.from(
        listing.reservePriceCurrencyValuePerToken.value || 0,
      ).mul(listing.quantity);
    }

    const formattedMinimumBid = utils.formatUnits(
      mimimumBidNumber,
      listing.reservePriceCurrencyValuePerToken.decimals,
    );

    return {
      mimimumBidNumber: formattedMinimumBid,
      minmumBid: `${formattedMinimumBid} ${listing.buyoutCurrencyValuePerToken.symbol}`,
      buyoutPrice: `${utils.formatUnits(
        BigNumber.from(listing.buyoutCurrencyValuePerToken.value).mul(
          listing.quantity,
        ),
        listing.buyoutCurrencyValuePerToken.decimals,
      )} ${listing.buyoutCurrencyValuePerToken.symbol}`,
      winningBid: winningBid?.currencyValue
        ? `${winningBid.currencyValue.displayValue} ${winningBid.currencyValue.symbol}`
        : undefined,
    } as const;
  }, [
    bidBuffer,
    listing.buyoutCurrencyValuePerToken.decimals,
    listing.buyoutCurrencyValuePerToken.symbol,
    listing.buyoutCurrencyValuePerToken.value,
    listing.quantity,
    listing.reservePriceCurrencyValuePerToken.decimals,
    listing.reservePriceCurrencyValuePerToken.value,
    winningBid?.currencyValue,
  ]);

  const remainingTime = useMemo(() => {
    const difference = BigNumber.from(listing.endTimeInEpochSeconds).sub(
      BigNumber.from(Math.floor(Date.now() / 1000)),
    );
    const days = Math.floor(
      difference.div(BigNumber.from(60 * 60 * 24)).toNumber(),
    );
    const hours = Math.floor(
      difference
        .mod(BigNumber.from(60 * 60 * 24))
        .div(BigNumber.from(60 * 60))
        .toNumber(),
    );
    const minutes = Math.floor(
      difference
        .mod(BigNumber.from(60 * 60))
        .div(BigNumber.from(60))
        .toNumber(),
    );

    return `${
      days
        ? `${days}d`
        : hours
        ? `${hours}h`
        : minutes
        ? `${minutes}m`
        : `ending now`
    }`;
  }, [listing.endTimeInEpochSeconds]);

  const endDateFormatted = useMemo(() => {
    const endDate = new Date(
      BigNumber.from(listing.endTimeInEpochSeconds).mul(1000).toNumber(),
    );

    if (endDate.toLocaleDateString() === new Date().toLocaleDateString()) {
      return `at ${endDate.toLocaleTimeString()}`;
    }

    return `on ${endDate.toLocaleDateString()} at ${endDate.toLocaleTimeString()}`;
  }, [listing.endTimeInEpochSeconds]);

  useEffect(() => {
    if (valuesFormatted.mimimumBidNumber) {
      setBid(valuesFormatted.mimimumBidNumber);
    }
  }, [valuesFormatted.mimimumBidNumber]);

  const colors = chakraTheme.colors;
  const accentColor = colors[primaryColor as keyof typeof colors][500];

  return (
    <Stack spacing={4} align="center" w="100%">
      <Stack w="100%" spacing={0}>
        {!isAuctionEnded ? (
          <>
            <Stack>
              <Flex w="100%" justifyContent="center" alignItems="center">
                <NumberInput
                  width="100%"
                  borderRightRadius="0"
                  value={bid}
                  onChange={(valueString) => {
                    setBid(valueString || valuesFormatted.mimimumBidNumber);
                  }}
                  min={parseFloat(valuesFormatted.mimimumBidNumber)}
                  bgColor="inputBg"
                >
                  <NumberInputField width="100%" borderRightRadius={0} />
                </NumberInput>
                <LightMode>
                  <Web3Button
                    contractAddress={contract?.getAddress() || ""}
                    style={{
                      backgroundColor: accentColor,
                    }}
                    theme={colorScheme}
                    isDisabled={
                      parseFloat(bid) <
                      parseFloat(valuesFormatted.mimimumBidNumber.toString())
                    }
                    action={() =>
                      contract?.auction.makeBid(
                        listing.id,
                        parseFloat(bid.toString()),
                      )
                    }
                    onSuccess={() => {
                      toast({
                        title: "Success",
                        description:
                          "You have successfully placed a bid on this listing",
                        status: "success",
                        duration: 5000,
                        isClosable: true,
                      });
                    }}
                    onError={(err) => {
                      console.error(err);
                      toast({
                        title: "Failed to place a bid on this auction",
                        status: "error",
                        duration: 9000,
                        isClosable: true,
                      });
                    }}
                  >
                    Bid
                  </Web3Button>
                </LightMode>
              </Flex>

              {BigNumber.from(listing.buyoutPrice).gt(0) && (
                <Tooltip
                  label={`
                      You can buyout this auction to instantly purchase 
                      all the listed assets and end the bidding process.
                    `}
                >
                  <LightMode>
                    <Web3Button
                      contractAddress={contract?.getAddress() || ""}
                      style={{
                        backgroundColor: accentColor,
                      }}
                      theme={colorScheme}
                      action={() => contract?.buyoutListing(listing.id)}
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
                      Buyout Auction ({valuesFormatted.buyoutPrice})
                    </Web3Button>
                  </LightMode>
                </Tooltip>
              )}

              <Stack
                bg={`${primaryColor}.50`}
                borderRadius="md"
                padding="12px"
                borderColor={`${primaryColor}.100`}
                borderWidth="1px"
                spacing={0}
              >
                {valuesFormatted.winningBid ? (
                  <Text>
                    {winningBid?.buyerAddress && (
                      <>
                        {winningBid?.buyerAddress === address ? (
                          `You are currently the highest bidder `
                        ) : (
                          <>
                            The highest bidder is currently{" "}
                            <Tooltip label={winningBid?.buyerAddress}>
                              <Text
                                fontWeight="bold"
                                cursor="pointer"
                                display="inline"
                              >
                                {winningBid?.buyerAddress.slice(0, 6)}...
                                {winningBid?.buyerAddress.slice(-4)}
                              </Text>
                            </Tooltip>
                          </>
                        )}
                      </>
                    )}{" "}
                    with a bid of <strong>{valuesFormatted.winningBid}</strong>.
                  </Text>
                ) : (
                  <Text color="gray.600" display="inline">
                    There are no bids in this auction yet.
                  </Text>
                )}
                <Text>
                  The minimum required to make a new bid is now&nbsp;
                  <strong>{valuesFormatted.minmumBid}</strong>.
                </Text>
                {BigNumber.from(listing.quantity).gt(1) && (
                  <Text>
                    The winner of this auction will receive{" "}
                    <strong>
                      {BigNumber.from(listing.quantity).toNumber()}
                    </strong>{" "}
                    of the displayed asset.
                  </Text>
                )}
              </Stack>

              <Stack
                bg={`${secondaryColor}.50`}
                borderRadius="md"
                padding="12px"
                borderColor={`${secondaryColor}.100`}
                borderWidth="1px"
                direction="row"
              >
                <Icon
                  color={`${secondaryColor}.300`}
                  as={AiFillExclamationCircle}
                  boxSize={6}
                />
                <Text>
                  This auction closes {endDateFormatted} (
                  <strong>{remainingTime}</strong>).
                </Text>
              </Stack>
            </Stack>
          </>
        ) : (
          <Stack>
            <LightMode>
              <Button
                width="100%"
                fontSize={{ base: "label.md", md: "label.lg" }}
                leftIcon={<IoDiamondOutline />}
                colorScheme={primaryColor}
                isDisabled
              >
                Auction Ended
              </Button>
            </LightMode>
            {auctionWinner && (
              <Stack
                bg={`${primaryColor}.50`}
                borderRadius="md"
                padding="12px"
                borderColor={`${primaryColor}.100`}
                borderWidth="1px"
                direction="row"
                align="center"
                spacing={3}
              >
                <Icon
                  color={`${primaryColor}.300`}
                  as={AiFillExclamationCircle}
                  boxSize={6}
                />
                {auctionWinner === address ? (
                  <Text>
                    You won this auction! The auctioned assets have been
                    transferred to your wallet.
                  </Text>
                ) : (
                  <Text>
                    This auction was won by{" "}
                    <Tooltip label={auctionWinner}>
                      <Text fontWeight="bold" cursor="pointer" display="inline">
                        {auctionWinner.slice(0, 10)}...
                      </Text>
                    </Tooltip>
                    <br />
                    If you made a bid, the bid has been refunded to your wallet.
                  </Text>
                )}
              </Stack>
            )}
          </Stack>
        )}
      </Stack>
    </Stack>
  );
};

const DirectListingComponent: React.FC<DirectListingProps> = ({
  contract,
  listing,
  primaryColor,
  colorScheme,
}) => {
  const address = useAddress();
  const [quantity, setQuantity] = useState(1);
  const [buySuccess, setBuySuccess] = useState(false);

  const pricePerToken = listing.buyoutCurrencyValuePerToken.value;

  const quantityLimit = useMemo(() => {
    return BigNumber.from(listing.quantity || 1);
  }, [listing.quantity]);

  const formattedPrice = useMemo(() => {
    if (!listing.buyoutCurrencyValuePerToken || !quantity) {
      return undefined;
    }
    const formatted = BigNumber.from(
      listing.buyoutCurrencyValuePerToken.value,
    ).mul(BigNumber.from(quantity));

    return `${utils.formatUnits(
      formatted,
      listing.buyoutCurrencyValuePerToken.decimals,
    )} ${listing.buyoutCurrencyValuePerToken.symbol}`;
  }, [listing.buyoutCurrencyValuePerToken, quantity]);

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
            style={{
              backgroundColor: accentColor,
            }}
            theme={colorScheme}
            isDisabled={!canClaim}
            action={() => contract?.buyoutListing(listing.id, quantity)}
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
        {listing?.type === ListingType.Direct ? (
          <DirectListingComponent
            contract={contract}
            listing={listing}
            primaryColor={primaryColor}
            secondaryColor={secondaryColor}
            colorScheme={colorScheme}
          />
        ) : (
          <AuctionListingComponent
            contract={contract}
            listing={listing}
            primaryColor={primaryColor}
            secondaryColor={secondaryColor}
            colorScheme={colorScheme}
          />
        )}
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
  const marketplace = useContract(contractAddress, "marketplace").contract;

  const { data: listing, isLoading } = useListing(marketplace, listingId);
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
            listing={listing as DirectListing | AuctionListing}
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
  const chain = JSON.parse(urlParams.get("chain") || "");
  const contractAddress = urlParams.get("contract") || "";
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
          activeChain={chain}
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
