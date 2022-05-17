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
import { ThirdwebProvider, useChainId } from "@thirdweb-dev/react";
import { NFTDrop } from "@thirdweb-dev/sdk";
import { formatUnits, parseUnits } from "ethers/lib/utils";
import React, { useEffect, useMemo, useRef, useState } from "react";
import ReactDOM from "react-dom";
import { IoDiamondOutline } from "react-icons/io5";
import {
  QueryClient,
  QueryClientProvider,
  useMutation,
  useQuery,
} from "react-query";
import { ConnectWalletButton } from "../shared/connect-wallet-button";
import { ConnectedWallet } from "../shared/connected-wallet";
import { Footer } from "../shared/footer";
import { NftCarousel } from "../shared/nft-carousel";
import { parseError } from "../shared/parseError";
import { DropSvg } from "../shared/svg/drop";
import chakraTheme from "../shared/theme";
import { fontsizeCss } from "../shared/theme/typography";
import { useAddress } from "../shared/useAddress";
import { useConnectors } from "../shared/useConnectors";
import { useSDKWithSigner } from "../shared/useSdkWithSigner";
import { parseIneligibility } from "../utils/parseIneligibility";
import { parseIpfsGateway } from "../utils/parseIpfsGateway";

interface NFTDropEmbedProps {
  startingTab?: "claim" | "inventory";
  colorScheme?: "light" | "dark";
  contractAddress: string;
  expectedChainId: number;
}

type Tab = "claim" | "inventory";

interface ContractInProps {
  contract?: NFTDrop;
}

interface HeaderProps extends ContractInProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
}

const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  contract,
}) => {
  const address = useAddress();

  const activeButtonProps: ButtonProps = {
    borderBottom: "4px solid",
    borderBottomColor: "blue.500",
  };

  const inactiveButtonProps: ButtonProps = {
    color: "gray.500",
  };

  const unclaimed = useQuery(
    ["numbers", "unclaimed"],
    () => contract?.totalUnclaimedSupply(),
    { enabled: !!contract },
  );

  const owned = useQuery(
    ["numbers", "owned", { address }],
    () => contract?.balanceOf(address || ""),
    {
      enabled: !!contract && !!address,
    },
  );

  const claimCondition = useQuery(
    ["claimcondition"],
    async () => {
      try {
        return await contract?.claimConditions.getActive();
      } catch {
        return undefined;
      }
    },
    { enabled: !!contract },
  );

  return (
    <Stack
      as="header"
      px="28px"
      direction="row"
      spacing="20px"
      w="100%"
      flexGrow={0}
      borderBottom="1px solid rgba(0,0,0,.1)"
      justify="space-between"
    >
      <Stack direction="row" spacing={5}>
        <Button
          h="48px"
          fontSize="subtitle.md"
          fontWeight="700"
          borderY="4px solid transparent"
          {...(activeTab === "claim" ? activeButtonProps : inactiveButtonProps)}
          variant="unstyled"
          borderRadius={0}
          onClick={() => setActiveTab("claim")}
        >
          Mint{unclaimed.data ? ` (${unclaimed.data})` : ""}
        </Button>
        <Button
          h="48px"
          fontSize="subtitle.md"
          fontWeight="700"
          borderY="4px solid transparent"
          {...(activeTab === "inventory"
            ? activeButtonProps
            : inactiveButtonProps)}
          variant="unstyled"
          borderRadius={0}
          onClick={() => setActiveTab("inventory")}
        >
          Inventory{owned.data ? ` (${owned.data})` : ""}
        </Button>
      </Stack>
      <ConnectedWallet tokenAddress={claimCondition?.data?.currencyAddress} />
    </Stack>
  );
};

interface ClaimPageProps {
  contract?: NFTDrop;
  expectedChainId: number;
}

const ClaimButton: React.FC<ClaimPageProps> = ({
  contract,
  expectedChainId,
}) => {
  const address = useAddress();
  const chainId = useChainId();
  const [quantity, setQuantity] = useState(1);
  const [claimSuccess, setClaimSuccess] = useState(false);
  const loaded = useRef(false);

  // Enable all queries
  const isEnabled = !!contract && !!address && chainId === expectedChainId;

  const claimed = useQuery(
    ["numbers", "claimed"],
    async () => contract?.totalClaimedSupply(),
    { enabled: isEnabled },
  );

  const owned = useQuery(
    ["numbers", "owned", { address }],
    () => contract?.balanceOf(address || ""),
    {
      enabled: !!contract && !!address,
    },
  );

  const unclaimed = useQuery(
    ["numbers", "unclaimed"],
    async () => contract?.totalUnclaimedSupply(),
    { enabled: isEnabled },
  );

  const claimCondition = useQuery(
    ["claimcondition"],
    async () => {
      try {
        return await contract?.claimConditions.getActive();
      } catch {
        return undefined;
      }
    },
    { enabled: !!contract },
  );

  const claimConditionReasons = useQuery(
    ["ineligiblereasons", { quantity, address }],
    async () => {
      try {
        const reasons =
          await contract?.claimConditions.getClaimIneligibilityReasons(
            quantity,
            address,
          );
        loaded.current = true;
        return reasons;
      } catch {
        return null;
      }
    },
    { enabled: !!contract && !!address },
  );

  const bnPrice = parseUnits(
    claimCondition.data?.currencyMetadata.displayValue || "0",
    claimCondition.data?.currencyMetadata.decimals,
  );
  const priceToMint = bnPrice.mul(quantity);

  const quantityLimit = claimCondition?.data?.quantityLimitPerTransaction;

  useEffect(() => {
    const t = setTimeout(() => setClaimSuccess(false), 3000);
    return () => clearTimeout(t);
  }, [claimSuccess]);

  const toast = useToast();

  const claimMutation = useMutation(
    (amount: number) => {
      if (!address || !contract) {
        throw new Error("No address or contract");
      }
      return contract.claim(amount);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries();
      },
    },
  );

  const claim = async () => {
    claimMutation.mutate(quantity, {
      onSuccess: () => {
        queryClient.invalidateQueries();
        toast({
          title: "Successfuly claimed.",
          status: "success",
          duration: 5000,
          isClosable: true,
        });
      },
      onError: (err) => {
        console.log(err);
        toast({
          title: "Failed to claim drop.",
          description: parseError(err),
          status: "error",
          duration: 9000,
          isClosable: true,
        });
      },
    });
  };

  // Only sold out when available data is loaded
  const isSoldOut = unclaimed.data?.eq(0);

  const isLoading = claimConditionReasons.isLoading && !loaded.current;

  const canClaim =
    !isSoldOut && !!address && !claimConditionReasons.data?.length;

  if (!isEnabled) {
    return <ConnectWalletButton expectedChainId={expectedChainId} />;
  }

  return (
    <Stack spacing={4} align="center" w="100%">
      <Flex w="100%" direction={{ base: "column", md: "row" }} gap={2}>
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
          max={quantityLimit === "unlimited" ? 1000 : Number(quantityLimit)}
          maxW={{ base: "100%", md: "100px" }}
        >
          <NumberInputField />
          <NumberInputStepper>
            <NumberIncrementStepper />
            <NumberDecrementStepper />
          </NumberInputStepper>
        </NumberInput>
        <Button
          fontSize={{ base: "label.md", md: "label.lg" }}
          isLoading={claimMutation.isLoading || isLoading}
          isDisabled={!canClaim}
          leftIcon={<IoDiamondOutline />}
          onClick={claim}
          isFullWidth
          colorScheme="blue"
        >
          {isSoldOut
            ? "Sold out"
            : canClaim
            ? `Mint${quantity > 1 ? ` ${quantity}` : ""}${
                claimCondition.data?.price.eq(0)
                  ? " (Free)"
                  : claimCondition.data?.currencyMetadata.displayValue
                  ? ` (${formatUnits(
                      priceToMint,
                      claimCondition.data.currencyMetadata.decimals,
                    )} ${claimCondition.data?.currencyMetadata.symbol})`
                  : ""
              }`
            : claimConditionReasons.data?.length
            ? parseIneligibility(
                claimConditionReasons.data,
                owned.data?.toNumber(),
              )
            : "Minting Unavailable"}
        </Button>
      </Flex>
      {claimed.data && (
        <Text size="label.md" color="green.800">
          {`${claimed.data?.toString()} / ${(
            claimed.data?.add(unclaimed.data || 0) || 0
          ).toString()} claimed`}
        </Text>
      )}
    </Stack>
  );
};

const ClaimPage: React.FC<ClaimPageProps> = ({ contract, expectedChainId }) => {
  const { data: metadata, isLoading } = useQuery(
    "contract_metadata",
    () => contract?.metadata.get(),
    { enabled: !!contract },
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
        <ClaimButton contract={contract} expectedChainId={expectedChainId} />
      </Flex>
    </Center>
  );
};

const InventoryPage: React.FC<ContractInProps> = ({ contract }) => {
  const address = useAddress();
  const ownedDrops = useQuery(
    "inventory",
    () => contract?.getOwned(address || ""),
    { enabled: !!contract && !!address },
  );
  const expectedChainId = Number(urlParams.get("expectedChainId"));

  if (ownedDrops.isLoading) {
    return (
      <Center w="100%" h="100%">
        <Stack direction="row" align="center">
          <Spinner />
          <Heading size="label.sm">Loading...</Heading>
        </Stack>
      </Center>
    );
  }

  const ownedDropsMetadata = ownedDrops.data?.map((d) => d.metadata);

  if (!address) {
    return (
      <Center w="100%" h="100%">
        <Stack spacing={4} direction="column" align="center">
          <Heading size="label.sm">
            Connect your wallet to see your owned drops
          </Heading>
          <ConnectWalletButton expectedChainId={expectedChainId} />
        </Stack>
      </Center>
    );
  }

  if (!ownedDropsMetadata?.length) {
    return (
      <Center w="100%" h="100%">
        <Stack direction="row" align="center">
          <Heading size="label.sm">No drops owned yet</Heading>
        </Stack>
      </Center>
    );
  }

  return <NftCarousel metadata={ownedDropsMetadata} />;
};

const Body: React.FC = ({ children }) => {
  return (
    <Flex as="main" px="28px" w="100%" flexGrow={1}>
      {children}
    </Flex>
  );
};

interface NFTDropEmbedProps {
  startingTab?: Tab;
  colorScheme?: "light" | "dark";
  rpcUrl?: string;
  relayUrl?: string;
  contractAddress: string;
  expectedChainId: number;
  ipfsGateway?: string;
}

const NFTDropEmbed: React.FC<NFTDropEmbedProps> = ({
  startingTab = "claim",
  rpcUrl,
  relayUrl,
  contractAddress,
  expectedChainId,
  ipfsGateway,
}) => {
  const [activeTab, setActiveTab] = useState(startingTab);
  const sdk = useSDKWithSigner({
    rpcUrl,
    relayUrl,
    expectedChainId,
    ipfsGateway,
  });

  const dropContract = useMemo(() => {
    if (!sdk || !contractAddress) {
      return undefined;
    }
    return sdk.getNFTDrop(contractAddress);
  }, [sdk, contractAddress]);

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
      <Header
        activeTab={activeTab}
        setActiveTab={(tab) => setActiveTab(tab)}
        contract={dropContract}
      />
      <Body>
        {activeTab === "claim" ? (
          <ClaimPage
            contract={dropContract}
            expectedChainId={expectedChainId}
          />
        ) : (
          <InventoryPage contract={dropContract} />
        )}
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
  const rpcUrl = urlParams.get("rpcUrl") || "";
  const relayerUrl = urlParams.get("relayUrl") || "";

  const connectors = useConnectors(expectedChainId, rpcUrl);

  const ipfsGateway = parseIpfsGateway(urlParams.get("ipfsGateway") || "");

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
          <ThirdwebProvider
            desiredChainId={expectedChainId}
            sdkOptions={{
              gasless: {
                openzeppelin: { relayerUrl },
              },
            }}
            /* chainRpc={{ expectedChainId: rpcUrl }} */
            /* ipfsGateway={ipfsGateway} */
          >
            <NFTDropEmbed
              contractAddress={contractAddress}
              expectedChainId={expectedChainId}
            />
          </ThirdwebProvider>
        </ChakraProvider>
      </QueryClientProvider>
    </>
  );
};

ReactDOM.render(<App />, document.getElementById("root"));
