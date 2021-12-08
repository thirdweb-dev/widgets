import React, { useCallback, useEffect, useMemo, useState } from "react";
import ReactDOM from "react-dom";
import {
  ChakraProvider,
  Flex,
  Heading,
  Image,
  Stack,
  AspectRatio,
  Box,
  Center,
  Spinner,
  Badge,
  ImageProps,
  Button,
  Icon,
} from "@chakra-ui/react";
import {
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from "@chakra-ui/react";
import { useWeb3, ThirdwebWeb3Provider } from "@3rdweb/hooks";
import { PoweredBy } from "../shared/powered-by";
import { ConnectWallet } from "@3rdweb/react";
import {
  ThirdwebSDK,
  ModuleMetadata,
  NFTMetadataOwner,
  PublicClaimCondition,
  DropModuleMetadata,
} from "@3rdweb/sdk";
import { Tabs, TabList, TabPanels, Tab, TabPanel } from "@chakra-ui/react";
import { IoDiamondOutline } from "react-icons/io5";

import { BigNumber } from "@ethersproject/bignumber";
import { Signer } from "@ethersproject/abstract-signer";
import { NftCarousel } from "../shared/nft-carousel";

let params = new URL(window.location.toString()).searchParams;

const CONTRACT_ADDRESS = params.get("contract");
const CHAIN = params.get("chain");

const connectors = {
  injected: {},
};

interface RotatingDropImageProps extends ImageProps {
  metadatWithOwner: NFTMetadataOwner[];
}

const RotatingDropImage: React.FC<RotatingDropImageProps> = ({
  metadatWithOwner,
  ...restImageProps
}) => {
  const filteredImageMap = useMemo(() => {
    return metadatWithOwner.filter((m) => !!m.metadata.image).slice(0, 100);
  }, [metadatWithOwner]);
  const length = filteredImageMap.length;
  const [currentIndex, setCurrentIndex] = useState(0);
  useEffect(() => {
    let interval = setInterval(() => {
      setCurrentIndex((idx) => (idx + 1) % length);
    }, 1000);
    return () => clearInterval(interval);
  }, [length]);

  return (
    <Image
      {...restImageProps}
      objectFit="contain"
      src={filteredImageMap[currentIndex].metadata.image}
      alt={filteredImageMap[currentIndex].metadata.name}
    />
  );
};

interface ErrorWithData extends Error {
  data?: Error;
}

const Layout: React.FC = () => {
  const { address, provider } = useWeb3();

  const sdk = useMemo(() => {
    if (!provider) {
      return null;
    }
    return new ThirdwebSDK(provider);
  }, [provider]);

  const signer: Signer | undefined = useMemo(() => {
    if (!provider) {
      return null;
    }
    const s = provider.getSigner();
    return Signer.isSigner(s) ? s : undefined;
  }, [provider]);

  useEffect(() => {
    if (!sdk) {
      return;
    }
    sdk.setProviderOrSigner(Signer.isSigner(signer) ? signer : undefined);
  }, [sdk, signer]);

  const drop = useMemo(() => {
    if (!sdk) {
      return null;
    }
    return sdk.getDropModule(CONTRACT_ADDRESS);
  }, [sdk]);

  const [isClaiming, setIsClaiming] = useState(false);
  const [claimError, setClaimError] = useState<ErrorWithData | null>(null);

  const [availableToClaim, setAvailableToClaim] = useState<NFTMetadataOwner[]>(
    []
  );
  const [ownedDrops, setOwnedDrops] = useState<NFTMetadataOwner[]>([]);
  const [metadata, setMetadata] = useState<ModuleMetadata>(undefined);
  const [numberOwned, setNumberOwned] = useState(BigNumber.from(0));
  const [totalAvailable, setTotalAvailable] = useState(BigNumber.from(0));
  const [activeClaimCondition, setActiveClaimCondition] =
    useState<PublicClaimCondition>();

  const [loaded, setLoaded] = useState(false);

  const reLoad = useCallback(async () => {
    if (!address || !drop) {
      return;
    }
    return Promise.all([
      await drop.getAll(),
      await drop.getMetadata(),
      await drop.balanceOf(address),
      await drop.totalUnclaimedSupply(),
      await drop.getOwned(address),
      await drop.getActiveMintCondition().catch((err) => {
        console.error("failed to get claim condition", err);
        return undefined;
      }),
    ]).then(
      ([
        _availableToClaim,
        _metadata,
        _numberOwned,
        _totalAvailable,
        _ownedDrops,
        _activeClaimCondition,
      ]) => {
        setAvailableToClaim(_availableToClaim);
        setMetadata(_metadata);
        setNumberOwned(_numberOwned);
        setActiveClaimCondition(_activeClaimCondition);
        setTotalAvailable(_totalAvailable);
        setOwnedDrops(_ownedDrops);
        setLoaded(true);
      }
    );
  }, [address, drop]);

  const onClaim = useCallback(async () => {
    setClaimError(null);
    if (!drop) {
      return;
    }
    setIsClaiming(true);
    try {
      await drop.claim(1);
      await reLoad();
    } catch (err) {
      console.error("failed to claim", err);
      setClaimError(err);
    } finally {
      setIsClaiming(false);
    }
  }, [drop, reLoad]);

  useEffect(() => {
    if (address && drop) {
      reLoad();
    }
  }, [drop, address]);

  const dropModuleMetadata = metadata?.metadata as unknown as
    | DropModuleMetadata
    | undefined;

  const totalAvailableNumber = totalAvailable.toNumber();
  const ownedNumber = numberOwned.toNumber();

  return (
    <Flex flexDir="column" w="100vw" h="100vh" px={10} pb={10}>
      <Flex
        as="header"
        flexShrink={0}
        py={4}
        justify="space-between"
        align="center"
      >
        <Stack direction="row" spacing={4} align="baseline">
          <Heading as="h1">{dropModuleMetadata?.name || ""}</Heading>
          {dropModuleMetadata?.symbol && (
            <Heading size="sm" fontWeight={500} as="h2">
              ${dropModuleMetadata.symbol}
            </Heading>
          )}
        </Stack>
        <ConnectWallet />
      </Flex>
      <Flex
        py={4}
        borderTop="1px solid rgba(0,0,0,.1)"
        as="main"
        flexGrow={1}
        justify="center"
        position="relative"
        overflow="hidden"
      >
        {!loaded ? (
          <Center>
            <Stack spacing={4} align="center" direction="row">
              <Spinner />{" "}
              <Heading size="xs" as="h4">
                Loading ...
              </Heading>
            </Stack>
          </Center>
        ) : (
          <Tabs variant="soft-rounded" w="100%">
            <TabList>
              <Tab align="center">
                Claim <Badge ml="3">{totalAvailableNumber}</Badge>
              </Tab>
              {ownedNumber > 0 && (
                <Tab align="center">
                  Your Inventory <Badge ml="3">{ownedNumber}</Badge>
                </Tab>
              )}
            </TabList>

            <TabPanels>
              <TabPanel>
                <Stack spacing={16} w="100%" align="center">
                  <AspectRatio ratio={1} w="50%">
                    <Box>
                      <RotatingDropImage
                        w="100%"
                        h="100%"
                        borderRadius="full"
                        metadatWithOwner={availableToClaim}
                      />
                    </Box>
                  </AspectRatio>
                  <Stack spacing={6}>
                    <Button
                      isLoading={isClaiming}
                      colorScheme="blue"
                      size="lg"
                      leftIcon={<Icon as={IoDiamondOutline} />}
                      rightIcon={
                        totalAvailableNumber ? (
                          <Badge colorScheme="blue">
                            {totalAvailableNumber} more available
                          </Badge>
                        ) : null
                      }
                      isDisabled={!drop || totalAvailableNumber === 0}
                      onClick={onClaim}
                    >
                      {totalAvailableNumber === 0 ? "All claimed" : "Claim"}
                    </Button>
                    {claimError && (
                      <Alert status="error">
                        <AlertIcon />
                        <Stack spacing={0}>
                          <AlertTitle mr={2}>Failed to claim!</AlertTitle>
                          <AlertDescription>
                            {claimError?.data?.message ||
                              claimError?.message ||
                              "Something went wrong"}
                          </AlertDescription>
                        </Stack>
                      </Alert>
                    )}
                  </Stack>
                </Stack>
              </TabPanel>
              {ownedNumber > 0 && (
                <TabPanel>
                  <NftCarousel metadata={ownedDrops.map((d) => d.metadata)} />
                </TabPanel>
              )}
            </TabPanels>
          </Tabs>
        )}
      </Flex>
      <Flex as="footer" flexShrink={0} py={4} justify="flex-end">
        <PoweredBy />
      </Flex>
    </Flex>
  );
};

const Providers: React.FC = () => {
  return (
    <ChakraProvider>
      <ThirdwebWeb3Provider
        supportedChainIds={[Number(CHAIN)]}
        connectors={connectors}
      >
        <Layout />
      </ThirdwebWeb3Provider>
    </ChakraProvider>
  );
};

ReactDOM.render(<Providers />, document.getElementById("root"));
