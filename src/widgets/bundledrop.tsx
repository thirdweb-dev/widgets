import { ThirdwebWeb3Provider, useWeb3 } from "@3rdweb/hooks";
import { ConnectWallet } from "@3rdweb/react";
import { BundleDropModule, ThirdwebSDK } from "@3rdweb/sdk";
import {
  AspectRatio,
  Button,
  ButtonProps,
  Center,
  ChakraProvider,
  Flex,
  Grid,
  Heading,
  Icon,
  Image,
  Spinner,
  Stack,
  Tab,
  Text,
  useToast,
} from "@chakra-ui/react";
import { css, Global } from "@emotion/react";
import { Signer } from "@ethersproject/abstract-signer";
import { BigNumber, BigNumberish } from "ethers";
import React, { useEffect, useMemo, useRef, useState } from "react";
import ReactDOM from "react-dom";
import { IoDiamondOutline } from "react-icons/io5";
import {
  QueryClient,
  QueryClientProvider,
  useMutation,
  useQuery,
} from "react-query";
import { ChainIDToRPCMap } from "../shared/commonRPCUrls";
import { NftCarousel } from "../shared/nft-carousel";
import { PoweredBy } from "../shared/powered-by";
import { DropSvg } from "../shared/svg/drop";
import chakraTheme from "../shared/theme";
import { fontsizeCss } from "../shared/theme/typography";
import { useFormatedValue } from "../shared/tokenHooks";

const connectors = {
  injected: {},
};

function parseHugeNumber(totalAvailable: BigNumberish = 0) {
  const bn = BigNumber.from(totalAvailable);
  if (bn.gte(Number.MAX_SAFE_INTEGER - 1)) {
    return "Unlimited";
  }
  const number = bn.toNumber();
  return new Intl.NumberFormat(undefined, {
    notation: bn.gte(1_00_000) ? "compact" : undefined,
  }).format(number);
}

interface DropWidgetProps {
  startingTab?: "claim" | "inventory";
  colorScheme?: "light" | "dark";
  rpcUrl?: string;
  contractAddress: string;
  chainId: number;
  tokenId: string;
}

type Tab = "claim" | "inventory";

interface ModuleInProps {
  module?: BundleDropModule;
}

interface HeaderProps extends ModuleInProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  tokenId: string;
}

const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  module,
  tokenId,
}) => {
  const { address } = useWeb3();
  const activeButtonProps: ButtonProps = {
    borderBottom: "4px solid",
    borderBottomColor: "blue.500",
  };

  const inactiveButtonProps: ButtonProps = {
    color: "gray.500",
  };

  const activeClaimCondition = useQuery(
    ["claim-condition"],
    async () => {
      return module?.getActiveClaimCondition(tokenId);
    },
    { enabled: !!module && tokenId.length > 0 },
  );

  const owned = useQuery(
    ["balance", { address }],
    async () => {
      return module?.balanceOf(address || "", tokenId);
    },
    {
      enabled: !!module && tokenId.length > 0 && !!address,
    },
  );

  const available = parseHugeNumber(activeClaimCondition.data?.availableSupply);

  return (
    <Stack
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
        Inventory{owned.data ? ` (${owned.data})` : ""}
      </Button>
    </Stack>
  );
};

interface ClaimPageProps {
  module?: BundleDropModule;
  sdk?: ThirdwebSDK;
  chainId?: number;
  tokenId: string;
}

const ConnectWalletButton: React.FC = () => (
  <ConnectWallet isFullWidth colorScheme="blue" borderRadius="full" />
);

const ClaimButton: React.FC<ClaimPageProps> = ({
  module,
  sdk,
  chainId,
  tokenId,
}) => {
  const { address } = useWeb3();

  const [claimSuccess, setClaimSuccess] = useState(false);

  const activeClaimCondition = useQuery(
    ["claim-condition"],
    async () => {
      return module?.getActiveClaimCondition(tokenId);
    },
    { enabled: !!module && tokenId.length > 0 },
  );

  const priceToMint = BigNumber.from(activeClaimCondition?.data?.price || 0);
  const currency = activeClaimCondition?.data?.currency;
  const claimed = activeClaimCondition.data?.currentMintSupply || "0";
  const totalAvailable = activeClaimCondition.data?.maxMintSupply || "0";

  const tokenModule = useMemo(() => {
    if (!currency || !sdk) {
      return undefined;
    }
    return sdk.getCurrencyModule(currency);
  }, [currency, sdk]);

  const formatedPrice = useFormatedValue(priceToMint, tokenModule, chainId);

  const isNotSoldOut = parseInt(claimed) < parseInt(totalAvailable);

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
      return module.claim(tokenId, 1);
    },
    {
      onSuccess: () => queryClient.invalidateQueries("numbers"),
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

  const isLoading = activeClaimCondition.isLoading;

  const canClaim = isNotSoldOut && address;

  return (
    <Stack spacing={4} align="center" w="100%">
      {address ? (
        <Button
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
            ? `Mint${
                priceToMint.eq(0)
                  ? " (Free)"
                  : formatedPrice
                  ? ` (${formatedPrice})`
                  : ""
              }`
            : "Minting Unavailable"}
        </Button>
      ) : (
        <ConnectWalletButton />
      )}
      <Text size="label.md" color="green.800">
        {`${parseHugeNumber(claimed)} / ${parseHugeNumber(
          totalAvailable,
        )} claimed`}
      </Text>
    </Stack>
  );
};

const ClaimPage: React.FC<ClaimPageProps> = ({
  module,
  sdk,
  chainId,
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
          chainId={chainId}
          sdk={sdk}
        />
      </Flex>
    </Center>
  );
};

const InventoryPage: React.FC<ModuleInProps> = ({ module }) => {
  const { address } = useWeb3();
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

  const ownedDropsMetadata = ownedDrops.data?.map((d) => d.metadata);

  if (!address) {
    return (
      <Center w="100%" h="100%">
        <Stack spacing={4} direction="column" align="center">
          <Heading size="label.sm">
            Connect your wallet to see your owned drops
          </Heading>
          <ConnectWalletButton />
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
    <Flex px="28px" w="100%" flexGrow={1}>
      {children}
    </Flex>
  );
};

const Footer: React.FC = () => {
  return (
    <Flex
      justifyContent="flex-end"
      align="center"
      h="48px"
      px="28px"
      w="100%"
      flexGrow={0}
    >
      <PoweredBy />
    </Flex>
  );
};

interface DropWidgetProps {
  startingTab?: Tab;
  colorScheme?: "light" | "dark";
  rpcUrl?: string;
  contractAddress: string;
  chainId: number;
  relayUrl: string | undefined;
}

const DropWidget: React.FC<DropWidgetProps> = ({
  startingTab = "claim",
  rpcUrl,
  contractAddress,
  chainId,
  tokenId,
  relayUrl,
}) => {
  const [activeTab, setActiveTab] = useState(startingTab);
  const { address, provider } = useWeb3();

  const rpc = useMemo(() => {
    return rpcUrl || ChainIDToRPCMap[chainId] || null;
  }, [rpcUrl, chainId]);

  const sdk = useMemo(() => {
    if (!rpc) {
      return undefined;
    }
    if (relayUrl) {
      console.log("relayUrl", relayUrl);
      return new ThirdwebSDK(rpc, { transactionRelayerUrl: relayUrl });
    }

    return new ThirdwebSDK(rpc);
  }, []);

  const signer: Signer | undefined = useMemo(() => {
    if (!provider) {
      return undefined;
    }
    const s = provider.getSigner();
    return Signer.isSigner(s) ? s : undefined;
  }, [provider]);

  useEffect(() => {
    if (!sdk || !Signer.isSigner(signer)) {
      return;
    }
    sdk.setProviderOrSigner(signer);
  }, [sdk, signer]);

  const dropModule = useMemo(() => {
    if (!sdk || !contractAddress) {
      return undefined;
    }
    return sdk.getBundleDropModule(contractAddress);
  }, [sdk]);

  const activeClaimCondition = useQuery(
    ["claim-condition"],
    async () => {
      return dropModule?.getActiveClaimCondition(tokenId);
    },
    { enabled: !!dropModule && tokenId.length > 0 },
  );

  const claimed = activeClaimCondition.data?.currentMintSupply || "0";
  const totalAvailable = activeClaimCondition.data?.maxMintSupply || "0";

  const owned = useQuery(
    ["numbers", "owned", { address }],
    () => dropModule?.balanceOf(address || "", tokenId),
    {
      enabled: !!dropModule && !!address,
    },
  );

  const isNotSoldOut = parseInt(claimed) < parseInt(totalAvailable);

  const onlyOnce = useRef(true);

  useEffect(() => {
    if (owned.data?.gt(0) && !isNotSoldOut && onlyOnce.current) {
      onlyOnce.current = false;
      setActiveTab("inventory");
    }
  }, [owned.data, isNotSoldOut]);

  return (
    <AspectRatio ratio={{ base: 1 / 1.5, sm: 1 }} w="100%">
      <Flex
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
          tokenId={tokenId}
        />
        <Body>
          {activeTab === "claim" ? (
            <ClaimPage
              module={dropModule}
              tokenId={tokenId}
              sdk={sdk}
              chainId={chainId}
            />
          ) : (
            <InventoryPage module={dropModule} />
          )}
        </Body>
        <Footer />
      </Flex>
    </AspectRatio>
  );
};

const queryClient = new QueryClient();
const urlParams = new URL(window.location.toString()).searchParams;

const App: React.FC = () => {
  const chainId = Number(urlParams.get("chainId"));
  const contractAddress = urlParams.get("contract") || "";
  const rpcUrl = urlParams.get("rpc") || "";
  const tokenId = urlParams.get("tokenId") || "";
  const relayUrl = urlParams.get("relayUrl") || "";

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
          <ThirdwebWeb3Provider
            supportedChainIds={[chainId]}
            connectors={connectors}
          >
            <DropWidget
              rpcUrl={rpcUrl}
              contractAddress={contractAddress}
              chainId={chainId}
              tokenId={tokenId}
              relayUrl={relayUrl}
            />
          </ThirdwebWeb3Provider>
        </ChakraProvider>
      </QueryClientProvider>
    </>
  );
};

ReactDOM.render(<App />, document.getElementById("root"));
