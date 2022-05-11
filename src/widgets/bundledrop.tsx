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
import { EditionDrop, ThirdwebSDK } from "@thirdweb-dev/sdk";
import { BigNumber, BigNumberish } from "ethers";
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
import { parseIneligibility } from "../utils/parseIneligibility";
import { parseIpfsGateway } from "../utils/parseIpfsGateway";

type Tab = "claim" | "inventory";

interface ModuleInProps {
  module?: EditionDrop;
  expectedChainId: number;
}

function parseHugeNumber(totalAvailable: BigNumberish = 0) {
  if (totalAvailable === "unlimited") {
    return "Unlimited";
  }

  const bn = BigNumber.from(totalAvailable);
  if (bn.gte(Number.MAX_SAFE_INTEGER - 1)) {
    return "Unlimited";
  }
  const number = bn.toNumber();
  return new Intl.NumberFormat(undefined, {
    notation: bn.gte(1_00_000) ? "compact" : undefined,
  }).format(number);
}
interface HeaderProps extends ModuleInProps {
  sdk?: ThirdwebSDK;
  tokenAddress?: string;
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  tokenId: string;
  expectedChainId: number;
}

const Header: React.FC<HeaderProps> = ({
  sdk,
  tokenAddress,
  activeTab,
  setActiveTab,
  module,
  expectedChainId,
  tokenId,
}) => {
  const address = useAddress();
  const [{ data: network }] = useNetwork();
  const chainId = useMemo(() => network?.chain?.id, [network]);

  const isEnabled = !!module && !!address && chainId === expectedChainId;

  const activeButtonProps: ButtonProps = {
    borderBottom: "4px solid",
    borderBottomColor: "blue.500",
  };

  const inactiveButtonProps: ButtonProps = {
    color: "gray.500",
  };

  const activeClaimCondition = useQuery(
    ["claim-condition", { tokenId }],
    async () => {
      try {
        return module?.claimConditions.getActive(tokenId);
      } catch {
        return undefined;
      }
    },
    { enabled: isEnabled && tokenId.length > 0 },
  );

  const available = parseHugeNumber(activeClaimCondition.data?.availableSupply);

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
          Mint{available ? ` (${available})` : ""}
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
          Inventory
        </Button>
      </Stack>
      <ConnectedWallet sdk={sdk} tokenAddress={tokenAddress} />
    </Stack>
  );
};

interface ClaimPageProps {
  module?: EditionDrop;
  sdk?: ThirdwebSDK;
  expectedChainId: number;
  tokenId: string;
}

const ClaimButton: React.FC<ClaimPageProps> = ({
  module,
  expectedChainId,
  tokenId,
}) => {
  const address = useAddress();
  const [{ data: network }] = useNetwork();
  const chainId = useMemo(() => network?.chain?.id, [network]);
  const [claimSuccess, setClaimSuccess] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const loaded = useRef(false);

  const isEnabled = !!module && !!address && chainId === expectedChainId;

  const owned = useQuery(
    ["numbers", "owned", { address }],
    () => module?.balanceOf(address || "", tokenId),
    {
      enabled: !!module && !!address,
    },
  );

  const activeClaimCondition = useQuery(
    ["claim-condition", { tokenId }],
    async () => {
      try {
        return await module?.claimConditions.getActive(tokenId);
      } catch {
        return undefined;
      }
    },
    { enabled: isEnabled && tokenId.length > 0 },
  );

  const claimConditionReasons = useQuery(
    ["ineligiblereasons", { tokenId, quantity, address }],
    async () => {
      try {
        const reasons =
          await module?.claimConditions.getClaimIneligibilityReasons(
            tokenId,
            quantity,
            address,
          );
        loaded.current = true;
        return reasons;
      } catch {
        return undefined;
      }
    },
    { enabled: !!module && !!address },
  );

  const bnPrice = parseUnits(
    activeClaimCondition.data?.currencyMetadata.displayValue || "0",
    activeClaimCondition.data?.currencyMetadata.decimals,
  );

  const priceToMint = bnPrice.mul(quantity);

  const isSoldOut =
    activeClaimCondition.data &&
    parseInt(activeClaimCondition.data?.availableSupply) === 0;

  useEffect(() => {
    const t = setTimeout(() => setClaimSuccess(false), 3000);
    return () => clearTimeout(t);
  }, [claimSuccess]);

  const toast = useToast();

  const claimMutation = useMutation(
    () => {
      if (!address || !module) {
        throw new Error("No address or module");
      }
      return module.claim(tokenId, quantity);
    },
    {
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
          title: "Minting failed",
          description: parseError(err),
          status: "error",
          duration: 9000,
          isClosable: true,
        });
      },
    },
  );

  const isLoading = claimConditionReasons.isLoading && !loaded.current;

  const canClaim =
    !isSoldOut && !!address && !claimConditionReasons.data?.length;

  const quantityLimit = activeClaimCondition?.data?.quantityLimitPerTransaction;

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
            setQuantity(value);
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
          isLoading={isLoading || claimMutation.isLoading}
          isDisabled={!canClaim}
          leftIcon={<IoDiamondOutline />}
          onClick={() => claimMutation.mutate()}
          isFullWidth
          colorScheme="blue"
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
            : claimConditionReasons.data?.length
            ? parseIneligibility(
                claimConditionReasons.data,
                owned.data?.toNumber(),
              )
            : "Minting Unavailable"}
        </Button>
      </Flex>
      {activeClaimCondition.data && (
        <Text size="label.md" color="green.800">
          {`${
            (Number(activeClaimCondition.data?.maxQuantity) || 0) -
            (Number(
              parseHugeNumber(activeClaimCondition.data.availableSupply),
            ) || 0)
          } ${
            activeClaimCondition.data?.maxQuantity !== "unlimited"
              ? `/ ${activeClaimCondition.data?.maxQuantity || 0}`
              : ""
          } claimed`}
        </Text>
      )}
    </Stack>
  );
};

const ClaimPage: React.FC<ClaimPageProps> = ({
  module,
  sdk,
  expectedChainId,
  tokenId,
}) => {
  const tokenMetadata = useQuery(
    ["token-metadata", { tokenId }],
    async () => {
      return module?.get(tokenId);
    },
    { enabled: !!module && tokenId.length > 0 },
  );

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

  const metaData = tokenMetadata.data?.metadata;

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
          {metaData?.image ? (
            <Image
              objectFit="contain"
              w="100%"
              h="100%"
              src={metaData?.image}
              alt={metaData?.name}
            />
          ) : (
            <Icon maxW="100%" maxH="100%" as={DropSvg} />
          )}
        </Grid>
        <Heading size="display.md" fontWeight="title" as="h1">
          {metaData?.name}
        </Heading>
        {metaData?.description && (
          <Heading noOfLines={2} as="h2" size="subtitle.md">
            {metaData.description}
          </Heading>
        )}
        <ClaimButton
          module={module}
          tokenId={tokenId}
          expectedChainId={expectedChainId}
          sdk={sdk}
        />
      </Flex>
    </Center>
  );
};

const InventoryPage: React.FC<ModuleInProps> = ({
  module,
  expectedChainId,
}) => {
  const address = useAddress();
  const ownedDrops = useQuery(
    "inventory",
    () => module?.getOwned(address || ""),
    { enabled: !!module && !!address },
  );

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

  const ownedDropsMetadata = ownedDrops.data?.map((d: any) => d.metadata);

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

interface BundleDropWidgetProps {
  startingTab?: Tab;
  colorScheme?: "light" | "dark";
  rpcUrl?: string;
  contractAddress: string;
  expectedChainId: number;
  relayUrl: string | undefined;
  tokenId: string;
  ipfsGateway?: string;
}

const BundleDropWidget: React.FC<BundleDropWidgetProps> = ({
  startingTab = "claim",
  rpcUrl,
  contractAddress,
  expectedChainId,
  tokenId,
  relayUrl,
  ipfsGateway,
}) => {
  const [activeTab, setActiveTab] = useState(startingTab);

  const sdk = useSDKWithSigner({
    expectedChainId,
    rpcUrl,
    relayUrl,
    ipfsGateway,
  });

  const dropModule = useMemo(() => {
    if (!sdk || !contractAddress) {
      return undefined;
    }
    return sdk.getEditionDrop(contractAddress);
  }, [sdk, contractAddress]);

  const activeClaimCondition = useQuery(
    ["claim-condition"],
    async () => {
      try {
        return await dropModule?.claimConditions.getActive(tokenId);
      } catch {
        return undefined;
      }
    },
    { enabled: !!dropModule && tokenId.length > 0 },
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
      borderColor="blackAlpha.100"
      bg="white"
    >
      <Header
        sdk={sdk}
        tokenAddress={activeClaimCondition.data?.currencyAddress}
        activeTab={activeTab}
        setActiveTab={(tab) => setActiveTab(tab)}
        module={dropModule}
        tokenId={tokenId}
        expectedChainId={expectedChainId}
      />
      <Body>
        {activeTab === "claim" ? (
          <ClaimPage
            module={dropModule}
            tokenId={tokenId}
            sdk={sdk}
            expectedChainId={expectedChainId}
          />
        ) : (
          <InventoryPage
            module={dropModule}
            expectedChainId={expectedChainId}
          />
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
  // default to expectedChainId default
  const rpcUrl = urlParams.get("rpcUrl") || "";
  const tokenId = urlParams.get("tokenId") || "0";
  const relayUrl = urlParams.get("relayUrl") || "";

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
          <Provider autoConnect connectors={connectors}>
            <BundleDropWidget
              rpcUrl={rpcUrl}
              contractAddress={contractAddress}
              expectedChainId={expectedChainId}
              tokenId={tokenId}
              relayUrl={relayUrl}
              ipfsGateway={ipfsGateway}
            />
          </Provider>
        </ChakraProvider>
      </QueryClientProvider>
    </>
  );
};

ReactDOM.render(<App />, document.getElementById("root"));
