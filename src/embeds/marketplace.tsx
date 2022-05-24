import {
  Button,
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
  Text,
  Tooltip,
  useToast,
} from "@chakra-ui/react";
import { css, Global } from "@emotion/react";
import {
  ThirdwebProvider,
  useAddress,
  useAuctionWinner,
  useBidBuffer,
  useBuyNow,
  useChainId,
  useListing,
  useMakeBid,
  useMarketplace,
  useToken,
  useWinningBid,
} from "@thirdweb-dev/react";
import {
  AuctionListing,
  DirectListing,
  IpfsStorage,
  ListingType,
  Marketplace,
} from "@thirdweb-dev/sdk";
import { BigNumber, ethers } from "ethers";
import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { AiFillExclamationCircle } from "react-icons/ai";
import { IoDiamondOutline } from "react-icons/io5";
import { RiAuctionLine } from "react-icons/ri";
import { ConnectWalletButton } from "../shared/connect-wallet-button";
import { ConnectedWallet } from "../shared/connected-wallet";
import { Footer } from "../shared/footer";
import { DropSvg } from "../shared/svg/drop";
import chakraTheme from "../shared/theme";
import { fontsizeCss } from "../shared/theme/typography";
import { useFormattedValue } from "../shared/tokenHooks";
import { parseIpfsGateway } from "../utils/parseIpfsGateway";

interface MarketplaceEmbedProps {
  colorScheme?: "light" | "dark";
  rpcUrl?: string;
  contractAddress: string;
  expectedChainId: number;
}

interface BuyPageProps {
  contract?: Marketplace;
  expectedChainId: number;
  listing: DirectListing | AuctionListing;
}

interface AuctionListingProps extends BuyPageProps {
  listing: AuctionListing;
}

interface DirectListingProps extends BuyPageProps {
  listing: DirectListing;
}

interface HeaderProps {
  tokenAddress?: string;
}

const Header: React.FC<HeaderProps> = ({ tokenAddress }) => {
  return (
    <Stack
      as="header"
      px="28px"
      direction="row"
      height="48px"
      w="100%"
      flexGrow={0}
      borderBottom="1px solid rgba(0,0,0,.1)"
      align="center"
      justify="flex-end"
    >
      <ConnectedWallet tokenAddress={tokenAddress} />
    </Stack>
  );
};

const AuctionListingComponent: React.FC<AuctionListingProps> = ({
  contract,
  expectedChainId,
  listing,
}) => {
  const toast = useToast();
  const address = useAddress();
  const token = useToken(listing.currencyContractAddress);
  const chainId = useChainId();
  const [bid, setBid] = useState("0");

  const isAuctionEnded = useMemo(() => {
    const endTime = BigNumber.from(listing.endTimeInEpochSeconds);
    const currentTime = BigNumber.from(Math.floor(Date.now() / 1000));

    return endTime.sub(currentTime).lte(0);
  }, [listing.endTimeInEpochSeconds]);

  const { data: winningBid } = useWinningBid(contract, listing.id);
  const { data: auctionWinner } = useAuctionWinner(contract, listing.id);
  const { data: bidBuffer } = useBidBuffer(contract);

  const { minimumBidNumber, minimumBidBN } = useMemo(() => {
    if (!bidBuffer) {
      return { minimumBidNumber: "0", minimumBidBN: BigNumber.from(0) };
    }

    const winningBidBN = winningBid?.currencyValue.value
      .mul(BigNumber.from(10000).add(bidBuffer))
      .div(BigNumber.from(10000));

    const reservePriceBN = listing.reservePriceCurrencyValuePerToken.value.mul(
      listing.quantity,
    );

    const winningBidNumber = ethers.utils.formatUnits(
      BigNumber.from(winningBid?.currencyValue.value || "0")
        .mul(BigNumber.from(10000).add(bidBuffer))
        .div(BigNumber.from(10000)),
      winningBid?.currencyValue.decimals || 18,
    );

    const reservePriceNumber = ethers.utils.formatUnits(
      BigNumber.from(listing.reservePriceCurrencyValuePerToken.value)
        .mul(listing.quantity)
        .toString(),
      listing.reservePriceCurrencyValuePerToken.decimals || 18,
    );

    const _minimumBidBN = BigNumber.from(winningBid?.currencyValue.value || 0)
      .mul(BigNumber.from(10000).add(bidBuffer))
      .div(BigNumber.from(10000));

    const minimumReservePriceBN = BigNumber.from(
      listing.reservePriceCurrencyValuePerToken.value || 0,
    ).mul(listing.quantity);

    return winningBidBN?.gt(reservePriceBN)
      ? { minimumBidNumber: winningBidNumber, minimumBidBN: _minimumBidBN }
      : {
          minimumBidNumber: reservePriceNumber,
          minimumBidBN: minimumReservePriceBN,
        };
  }, [
    winningBid?.currencyValue?.value,
    winningBid?.currencyValue?.decimals,
    listing.reservePriceCurrencyValuePerToken,
    bidBuffer,
    listing.quantity,
  ]);

  const minimumBidFormatted = useFormattedValue(
    minimumBidBN,
    token,
    expectedChainId,
  );

  const winningBidFormatted = useFormattedValue(
    winningBid?.currencyValue.value,
    token,
    expectedChainId,
  );

  const buyoutPrice = useFormattedValue(
    BigNumber.from(listing.buyoutCurrencyValuePerToken.value).mul(
      listing.quantity,
    ),
    token,
    expectedChainId,
  );

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
    setBid(minimumBidNumber);
  }, [minimumBidNumber]);

  const makeBidMutation = useMakeBid(contract);

  const makeBid = async () => {
    makeBidMutation.mutate(
      { listingId: listing.id, bid: bid.toString() },
      {
        onSuccess: () => {
          toast({
            title: "Success",
            description: "You have successfully placed a bid on this listing",
            status: "success",
            duration: 5000,
            isClosable: true,
          });
        },
        onError: (err) => {
          console.error(err);
          toast({
            title: "Failed to place a bid on this auction",
            status: "error",
            duration: 9000,
            isClosable: true,
          });
        },
      },
    );
  };

  const buyNowMutation = useBuyNow(contract);

  const buyNow = async () => {
    buyNowMutation.mutate(
      { id: listing.id, type: listing.type },
      {
        onSuccess: () => {
          toast({
            title: "Success",
            description: "You have successfully purchased from this listing",
            status: "success",
            duration: 5000,
            isClosable: true,
          });
        },
        onError: (err) => {
          console.error(err);
          toast({
            title: "Failed to purchase from listing",
            status: "error",
            duration: 9000,
            isClosable: true,
          });
        },
      },
    );
  };

  return (
    <Stack spacing={4} align="center" w="100%">
      {address && chainId === expectedChainId ? (
        <Stack w="100%" spacing={0}>
          {!isAuctionEnded ? (
            <>
              <Stack>
                <Flex w="100%">
                  <NumberInput
                    width="100%"
                    borderRightRadius="0"
                    value={bid}
                    onChange={(valueString) => {
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
                    isLoading={makeBidMutation.isLoading}
                    leftIcon={<RiAuctionLine />}
                    colorScheme="blue"
                    onClick={makeBid}
                    isDisabled={parseFloat(bid) < parseFloat(minimumBidNumber)}
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
                      isLoading={buyNowMutation.isLoading}
                      leftIcon={<IoDiamondOutline />}
                      colorScheme="blue"
                      onClick={buyNow}
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
                  {winningBidFormatted ? (
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
                      with a bid of <strong>{winningBidFormatted}</strong>.
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
                  bg="orange.50"
                  borderRadius="md"
                  padding="12px"
                  borderColor="orange.100"
                  borderWidth="1px"
                  direction="row"
                >
                  <Icon
                    color="orange.300"
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
                  direction="row"
                  align="center"
                  spacing={3}
                >
                  <Icon
                    color="blue.300"
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
                        <Text
                          fontWeight="bold"
                          cursor="pointer"
                          display="inline"
                        >
                          {auctionWinner.slice(0, 10)}...
                        </Text>
                      </Tooltip>
                      <br />
                      If you made a bid, the bid has been refunded to your
                      wallet.
                    </Text>
                  )}
                </Stack>
              )}
            </Stack>
          )}
        </Stack>
      ) : (
        <ConnectWalletButton expectedChainId={expectedChainId} />
      )}
    </Stack>
  );
};

const DirectListingComponent: React.FC<DirectListingProps> = ({
  contract,
  expectedChainId,
  listing,
}) => {
  const address = useAddress();
  const chainId = useChainId();
  const token = useToken(listing.currencyContractAddress);
  const [quantity, setQuantity] = useState(1);
  const [buySuccess, setBuySuccess] = useState(false);

  const pricePerToken = listing.buyoutCurrencyValuePerToken.value;

  const quantityLimit = useMemo(() => {
    return BigNumber.from(listing.quantity || 1);
  }, [listing.quantity]);

  const formattedPrice = useFormattedValue(
    BigNumber.from(listing.buyoutCurrencyValuePerToken.value).mul(
      BigNumber.from(quantity),
    ),
    token,
    expectedChainId,
  );

  const toast = useToast();
  const isSoldOut = BigNumber.from(listing.quantity).eq(0);

  useEffect(() => {
    const t = setTimeout(() => setBuySuccess(false), 3000);
    return () => clearTimeout(t);
  }, [buySuccess]);

  const buyNowMutation = useBuyNow(contract);

  const buyNow = async () => {
    buyNowMutation.mutate(
      { id: listing.id, type: listing.type, buyAmount: quantity },
      {
        onSuccess: () => {
          toast({
            title: "Success",
            description: "You have successfully purchased from this listing",
            status: "success",
            duration: 5000,
            isClosable: true,
          });
        },
        onError: (err) => {
          console.error(err);
          toast({
            title: "Failed to purchase from listing",
            status: "error",
            duration: 9000,
            isClosable: true,
          });
        },
      },
    );
  };

  const canClaim = !isSoldOut && !!address;

  const showQuantityInput =
    canClaim && quantityLimit.gt(1) && quantityLimit.lte(1000);

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
            isLoading={buyNowMutation.isLoading}
            isDisabled={!canClaim}
            leftIcon={<IoDiamondOutline />}
            onClick={buyNow}
            w="full"
            colorScheme="blue"
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
          </Button>
        </Flex>
      ) : (
        <ConnectWalletButton expectedChainId={expectedChainId} />
      )}
    </Stack>
  );
};

const BuyPage: React.FC<BuyPageProps> = ({
  contract,
  expectedChainId,
  listing,
}) => {
  if (listing === null) {
    return (
      <Center w="100%" h="100%">
        <Button colorScheme="primary" w="100%" isDisabled>
          This listing was either cancelled or does not exist.
        </Button>
      </Center>
    );
  }

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
              src={listing?.asset?.image.replace(
                "ipfs://",
                "https://cloudflare-ipfs.com/ipfs/",
              )}
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
          <DirectListingComponent
            contract={contract}
            expectedChainId={expectedChainId}
            listing={listing}
          />
        ) : (
          <AuctionListingComponent
            contract={contract}
            expectedChainId={expectedChainId}
            listing={listing}
          />
        )}
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

interface MarketplaceEmbedProps {
  colorScheme?: "light" | "dark";
  contractAddress: string;
  expectedChainId: number;
  listingId: string;
}

const MarketplaceEmbed: React.FC<MarketplaceEmbedProps> = ({
  contractAddress,
  expectedChainId,
  listingId,
}) => {
  const marketplace = useMarketplace(contractAddress);

  const { data: listing } = useListing(marketplace, listingId);

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
      borderColor="blackAlpha.100"
      bg="white"
    >
      <Header tokenAddress={listing?.currencyContractAddress} />
      <Body>
        <BuyPage
          contract={marketplace}
          expectedChainId={expectedChainId}
          listing={listing as DirectListing | AuctionListing}
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
  const listingId = urlParams.get("listingId") || "";
  const relayerUrl = urlParams.get("relayUrl") || "";

  const ipfsGateway = parseIpfsGateway(urlParams.get("ipfsGateway") || "");

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
          <MarketplaceEmbed
            contractAddress={contractAddress}
            expectedChainId={expectedChainId}
            listingId={listingId}
          />
        </ThirdwebProvider>
      </ChakraProvider>
    </>
  );
};

const container = document.getElementById("root") as Element;
const root = createRoot(container);
root.render(<App />);
