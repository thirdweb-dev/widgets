import { DropErc721Contract, ThirdwebSDK } from "@3rdweb/sdk";
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
import { BigNumber } from "ethers";
import { formatUnits, parseUnits } from "ethers/lib/utils";
import React, { useEffect, useMemo, useState } from "react";
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

interface DropWidgetProps {
  startingTab?: "claim" | "inventory";
  colorScheme?: "light" | "dark";
  rpcUrl?: string;
  contractAddress: string;
  expectedChainId: number;
}

type Tab = "claim" | "inventory";

interface ModuleInProps {
  module?: DropErc721Contract;
}

interface HeaderProps extends ModuleInProps {
  sdk?: ThirdwebSDK;
  tokenAddress?: string;
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  expectedChainId: number;
}

const Header: React.FC<HeaderProps> = ({
  sdk,
  expectedChainId,
  tokenAddress,
  activeTab,
  setActiveTab,
  module,
}) => {
  const address = useAddress();
  const [{ data: network }] = useNetwork();
  const chainId = useMemo(() => network?.chain?.id, [network]);

  // Enable all queries
  const isEnabled = !!module && !!address && chainId === expectedChainId;

  const activeButtonProps: ButtonProps = {
    borderBottom: "4px solid",
    borderBottomColor: "blue.500",
  };

  const inactiveButtonProps: ButtonProps = {
    color: "gray.500",
  };

  const available = useQuery(
    ["numbers", "available"],
    () => module?.totalUnclaimedSupply(),
    { enabled: !!module },
  );

  const owned = useQuery(
    ["numbers", "owned", { address }],
    () => module?.balanceOf(address || ""),
    {
      enabled: !!module && !!address,
    },
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
          Mint{available.data ? ` (${available.data})` : ""}
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
      <ConnectedWallet sdk={sdk} tokenAddress={tokenAddress} />
    </Stack>
  );
};

interface ClaimPageProps {
  module?: DropErc721Contract;
  sdk?: ThirdwebSDK;
  expectedChainId: number;
}

const ClaimButton: React.FC<ClaimPageProps> = ({
  module,
  sdk,
  expectedChainId,
}) => {
  const [{ data: network }] = useNetwork();
  const address = useAddress();
  const chainId = useMemo(() => network?.chain?.id, [network]);
  const [quantity, setQuantity] = useState(1);
  const [claimSuccess, setClaimSuccess] = useState(false);

  // Enable all queries
  const isEnabled = !!module && !!address && chainId === expectedChainId;

  const claimed = useQuery(
    ["numbers", "claimed"],
    () => module?.totalClaimedSupply(),
    { enabled: isEnabled },
  );

  const totalAvailable = useQuery(
    ["numbers", "total"],
    () => module?.totalSupply(),
    { enabled: isEnabled },
  );

  const unclaimed = useQuery(
    ["numbers", "available"],
    () => module?.totalUnclaimedSupply(),
    { enabled: isEnabled },
  );

  const claimCondition = useQuery(
    ["claimcondition"],
    () => module?.claimConditions.getActive(),
    { enabled: !!module },
  );

  const claimConditionReasons = useQuery(
    ["ineligiblereasons", { quantity, address }],
    () =>
      module?.claimConditions.getClaimIneligibilityReasons(quantity, address),
    { enabled: !!module && !!address },
  );

  const bnPrice = parseUnits(
    claimCondition.data?.currencyMetadata.displayValue || "0",
    claimCondition.data?.currencyMetadata.decimals,
  );
  const priceToMint = bnPrice.mul(quantity);

  const quantityLimit = claimCondition?.data?.quantityLimitPerTransaction || 1;

  const quantityLimitBigNumber = useMemo(() => {
    const bn = BigNumber.from(quantityLimit);
    const unclaimedBn = BigNumber.from(unclaimed.data || 0);

    if (unclaimedBn.lt(bn)) {
      return unclaimedBn;
    }
    return bn;
  }, [quantityLimit]);

  const isNotSoldOut = claimed.data?.lt(totalAvailable.data || 0);

  useEffect(() => {
    let t = setTimeout(() => setClaimSuccess(false), 3000);
    return () => clearTimeout(t);
  }, [claimSuccess]);

  const toast = useToast();

  const claimMutation = useMutation(
    (quantity: number) => {
      if (!address || !module) {
        throw new Error("No address or module");
      }
      return module.claim(quantity);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries();
      },
    },
  );

  const claim = async () => {
    const metadata = await module?.metadata.get();
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
        toast({
          title: "Failed to claim drop.",
          description: parseError(err),
          status: "error",
          duration: 9000,
          isClosable: true,
        });
      },
    })
  }

  const isLoading =
    totalAvailable.isLoading ||
    claimed.isLoading ||
    claimCondition.isLoading ||
    claimConditionReasons.isLoading;

  const canClaim =
    !!isNotSoldOut && !!address && !claimConditionReasons.data?.length;

  const showQuantityInput =
    canClaim &&
    quantityLimitBigNumber.gt(1) &&
    quantityLimitBigNumber.lte(1000);

  if (!isEnabled) {
    return <ConnectWalletButton expectedChainId={expectedChainId} />;
  }

  return (
    <Stack spacing={4} align="center" w="100%">
      <Flex w="100%" direction={{ base: "column", md: "row" }} gap={2}>
        {showQuantityInput && !isLoading && (
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
            max={quantityLimitBigNumber.toNumber()}
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
          isLoading={claimMutation.isLoading}
          isDisabled={!canClaim}
          leftIcon={<IoDiamondOutline />}
          onClick={claim}
          isFullWidth
          colorScheme="blue"
        >
          {!isNotSoldOut
            ? "Sold out"
            : canClaim
            ? `Mint${showQuantityInput ? ` ${quantity}` : ""}${
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
            ? claimConditionReasons.data[0]
            : "Minting Unavailable"}
        </Button>
      </Flex>
      {claimed.data && totalAvailable.data && (
        <Text size="label.md" color="green.800">
          {`${claimed.data?.toString()} / ${totalAvailable.data?.toString()} claimed`}
        </Text>
      )}
    </Stack>
  );
};

const ClaimPage: React.FC<ClaimPageProps> = ({
  module,
  sdk,
  expectedChainId,
}) => {
  const { data: metadata, isLoading } = useQuery(
    "module_metadata",
    () => module?.metadata.get(),
    { enabled: !!module },
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
        <ClaimButton
          module={module}
          expectedChainId={expectedChainId}
          sdk={sdk}
        />
      </Flex>
    </Center>
  );
};

const InventoryPage: React.FC<ModuleInProps> = ({ module }) => {
  const address = useAddress();
  const ownedDrops = useQuery(
    "inventory",
    () => module?.getOwned(address || ""),
    { enabled: !!module && !!address },
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

interface DropWidgetProps {
  startingTab?: Tab;
  colorScheme?: "light" | "dark";
  rpcUrl?: string;
  relayUrl?: string;
  contractAddress: string;
  expectedChainId: number;
}

const DropWidget: React.FC<DropWidgetProps> = ({
  startingTab = "claim",
  rpcUrl,
  relayUrl,
  contractAddress,
  expectedChainId,
}) => {
  const [activeTab, setActiveTab] = useState(startingTab);
  const address = useAddress();
  const sdk = useSDKWithSigner({ rpcUrl, relayUrl, expectedChainId });

  const dropModule = useMemo(() => {
    if (!sdk || !contractAddress) {
      return undefined;
    }
    return sdk.getDropContract(contractAddress);
  }, [sdk]);

  const available = useQuery(
    ["numbers", "available"],
    () => dropModule?.totalUnclaimedSupply(),
    { enabled: !!dropModule },
  );

  const totalAvailable = useQuery(
    ["numbers", "total"],
    () => dropModule?.totalSupply(),
    { enabled: !!dropModule },
  );

  const owned = useQuery(
    ["numbers", "owned", { address }],
    () => dropModule?.balanceOf(address || ""),
    {
      enabled: !!dropModule && !!address,
    },
  );

  const claimCondition = useQuery(
    ["claimcondition"],
    () => dropModule?.claimConditions.getActive(),
    { enabled: !!dropModule },
  );

  const isNotSoldOut = totalAvailable.data?.gte(available.data || 0);

  const numOwned = BigNumber.from(owned.data || 0).toNumber();
  useEffect(() => {
    if (owned.data?.gt(0) && isNotSoldOut) {
      setActiveTab("inventory");
    }
  }, [numOwned, isNotSoldOut]);

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
        sdk={sdk}
        expectedChainId={expectedChainId}
        tokenAddress={claimCondition.data?.currencyAddress}
        activeTab={activeTab}
        setActiveTab={(tab) => setActiveTab(tab)}
        module={dropModule}
      />
      <Body>
        {activeTab === "claim" ? (
          <ClaimPage
            module={dropModule}
            sdk={sdk}
            expectedChainId={expectedChainId}
          />
        ) : (
          <InventoryPage module={dropModule} />
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
            <DropWidget
              rpcUrl={rpcUrl}
              relayUrl={relayUrl}
              contractAddress={contractAddress}
              expectedChainId={expectedChainId}
            />
          </Provider>
        </ChakraProvider>
      </QueryClientProvider>
    </>
  );
};

ReactDOM.render(<App />, document.getElementById("root"));
