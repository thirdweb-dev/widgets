import { DropModule, ThirdwebSDK } from "@3rdweb/sdk";
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
import React, { useEffect, useMemo, useRef, useState } from "react";
import ReactDOM from "react-dom";
import { IoDiamondOutline } from "react-icons/io5";
import {
  QueryClient,
  QueryClientProvider,
  useMutation,
  useQuery,
} from "react-query";
import { useAddress } from "src/shared/useAddress";
import { useConnectors } from "src/shared/useConnectors";
import { useSDKWithSigner } from "src/shared/useSdkWithSigner";
import { Provider, useNetwork } from "wagmi";
import { ConnectWalletButton } from "../shared/connect-wallet-button";
import { Footer } from "../shared/footer";
import { NftCarousel } from "../shared/nft-carousel";
import { DropSvg } from "../shared/svg/drop";
import chakraTheme from "../shared/theme";
import { fontsizeCss } from "../shared/theme/typography";
import { useFormatedValue } from "../shared/tokenHooks";

interface DropWidgetProps {
  startingTab?: "claim" | "inventory";
  colorScheme?: "light" | "dark";
  rpcUrl?: string;
  contractAddress: string;
  expextedChainId: number;
}

type Tab = "claim" | "inventory";

interface ModuleInProps {
  module?: DropModule;
}

interface HeaderProps extends ModuleInProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
}

const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab, module }) => {
  const address = useAddress();
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
    >
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
  );
};

interface ClaimPageProps {
  module?: DropModule;
  sdk?: ThirdwebSDK;
  expextedChainId: number;
}

const ClaimButton: React.FC<ClaimPageProps> = ({
  module,
  sdk,
  expextedChainId,
}) => {
  const [{ data: network }] = useNetwork();
  const address = useAddress();
  const chainId = useMemo(() => network?.chain?.id, [network]);

  const [quantity, setQuantity] = useState(1);

  const [claimSuccess, setClaimSuccess] = useState(false);

  const claimed = useQuery(
    ["numbers", "claimed"],
    () => module?.totalClaimedSupply(),
    { enabled: !!module },
  );

  const totalAvailable = useQuery(
    ["numbers", "total"],
    () => module?.totalSupply(),
    { enabled: !!module },
  );

  const unclaimed = useQuery(
    ["numbers", "available"],
    () => module?.totalUnclaimedSupply(),
    { enabled: !!module },
  );

  const claimCondition = useQuery(
    ["claimcondition"],
    () => module?.getActiveClaimCondition(),
    { enabled: !!module },
  );

  const priceToMint = BigNumber.from(
    claimCondition?.data?.pricePerToken || 0,
  ).mul(quantity);
  const currency = claimCondition?.data?.currency;
  const quantityLimit = claimCondition?.data?.quantityLimitPerTransaction || 1;

  const quantityLimitBigNumber = useMemo(() => {
    const bn = BigNumber.from(quantityLimit);
    const unclaimedBn = BigNumber.from(unclaimed.data || 0);

    if (unclaimedBn.lt(bn)) {
      return unclaimedBn;
    }
    return bn;
  }, [quantityLimit]);

  const tokenModule = useMemo(() => {
    if (!currency || !sdk) {
      return undefined;
    }
    return sdk.getTokenModule(currency);
  }, [currency, sdk]);

  const formatedPrice = useFormatedValue(
    priceToMint,
    tokenModule,
    expextedChainId,
  );

  const isNotSoldOut = claimed.data?.lt(totalAvailable.data || 0);

  useEffect(() => {
    let t = setTimeout(() => setClaimSuccess(false), 3000);
    return () => clearTimeout(t);
  }, [claimSuccess]);

  const toast = useToast();

  const claimMutation = useMutation(
    () => {
      if (!address || !module) {
        throw new Error("No address or module");
      }
      return module.claim(quantity);
    },
    {
      onSuccess: () => queryClient.invalidateQueries(),
      onError: (err) => {
        const anyErr = err as any;
        let message = "";

        if (anyErr.code === "INSUFFICIENT_FUNDS") {
          message = "Insufficient funds to mint";
        }
        if (anyErr.code === "UNPREDICTABLE_GAS_LIMIT") {
          if (anyErr.message.includes("exceed max mint supply")) {
            message = "You are not eligible to mint right now";
          }
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

  const isLoading = totalAvailable.isLoading || claimed.isLoading;

  const canClaim = !!isNotSoldOut && !!address;

  const showQuantityInput =
    canClaim &&
    quantityLimitBigNumber.gt(1) &&
    quantityLimitBigNumber.lte(1000);

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
            isLoading={isLoading || claimMutation.isLoading}
            isDisabled={!canClaim}
            leftIcon={<IoDiamondOutline />}
            onClick={() => claimMutation.mutate()}
            isFullWidth
            colorScheme="blue"
          >
            {!isNotSoldOut
              ? "Sold out"
              : canClaim
              ? `Mint${showQuantityInput ? ` ${quantity}` : ""}${
                  priceToMint.eq(0)
                    ? " (Free)"
                    : formatedPrice
                    ? ` (${formatedPrice})`
                    : ""
                }`
              : "Minting Unavailable"}
          </Button>
        </Flex>
      ) : (
        <ConnectWalletButton expextedChainId={expextedChainId} />
      )}
      <Text size="label.md" color="green.800">
        {`${claimed.data?.toString()} / ${totalAvailable.data?.toString()} claimed`}
      </Text>
    </Stack>
  );
};

const ClaimPage: React.FC<ClaimPageProps> = ({
  module,
  sdk,
  expextedChainId,
}) => {
  const { data, isLoading } = useQuery(
    "module_metadata",
    () => module?.getMetadata(),
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
          {data?.metadata?.image ? (
            <Image
              objectFit="contain"
              w="100%"
              h="100%"
              src={data?.metadata?.image}
              alt={data?.metadata?.name}
            />
          ) : (
            <Icon maxW="100%" maxH="100%" as={DropSvg} />
          )}
        </Grid>
        <Heading size="display.md" fontWeight="title" as="h1">
          {data?.metadata?.name}
        </Heading>
        {data?.metadata?.description && (
          <Heading noOfLines={2} as="h2" size="subtitle.md">
            {data.metadata.description}
          </Heading>
        )}
        <ClaimButton
          module={module}
          expextedChainId={expextedChainId}
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
  const expextedChainId = Number(urlParams.get("expextedChainId"));

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
          <ConnectWalletButton expextedChainId={expextedChainId} />
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
  expextedChainId: number;
}

const DropWidget: React.FC<DropWidgetProps> = ({
  startingTab = "claim",
  rpcUrl,
  relayUrl,
  contractAddress,
  expextedChainId,
}) => {
  const [activeTab, setActiveTab] = useState(startingTab);
  const address = useAddress();

  const sdk = useSDKWithSigner({ rpcUrl, relayUrl, expextedChainId });

  const dropModule = useMemo(() => {
    if (!sdk || !contractAddress) {
      return undefined;
    }
    return sdk.getDropModule(contractAddress);
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

  const isSoldOut = totalAvailable.data?.gte(available.data || 0);

  const onlyOnce = useRef(true);

  useEffect(() => {
    if (owned.data?.gt(0) && isSoldOut && onlyOnce.current) {
      onlyOnce.current = false;
      setActiveTab("inventory");
    }
  }, [owned.data, isSoldOut]);

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
      <Header
        activeTab={activeTab}
        setActiveTab={(tab) => setActiveTab(tab)}
        module={dropModule}
      />
      <Body>
        {activeTab === "claim" ? (
          <ClaimPage
            module={dropModule}
            sdk={sdk}
            expextedChainId={expextedChainId}
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
  const expextedChainId = Number(urlParams.get("chainId"));
  const contractAddress = urlParams.get("contract") || "";
  const rpcUrl = urlParams.get("rpcUrl") || "";
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
            <DropWidget
              rpcUrl={rpcUrl}
              relayUrl={relayUrl}
              contractAddress={contractAddress}
              expextedChainId={expextedChainId}
            />
          </Provider>
        </ChakraProvider>
      </QueryClientProvider>
    </>
  );
};

ReactDOM.render(<App />, document.getElementById("root"));
