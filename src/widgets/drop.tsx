import { ThirdwebWeb3Provider, useWeb3 } from "@3rdweb/hooks";
import { ConnectWallet } from "@3rdweb/react";
import { DropModule, ThirdwebSDK } from "@3rdweb/sdk";
import {
  AspectRatio,
  Button,
  ButtonProps,
  Center,
  ChakraProvider,
  Flex,
  Heading,
  Image,
  Spinner,
  Stack,
  Tab,
  Text,
} from "@chakra-ui/react";
import { css, Global } from "@emotion/react";
import { Signer } from "@ethersproject/abstract-signer";
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
import chakraTheme from "../shared/theme";
import { fontsizeCss } from "../shared/theme/typography";

const connectors = {
  injected: {},
};

interface DropWidgetProps {
  startingTab?: "claim" | "inventory";
  colorScheme?: "light" | "dark";
  rpcUrl?: string;
  contractAddress: string;
  chainId: number;
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
  const { address } = useWeb3();
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
        Claim{available.data ? ` (${available.data})` : ""}
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
}

const ConnectWalletButton: React.FC = () => (
  <ConnectWallet isFullWidth colorScheme="blue" borderRadius="full" />
);

const ClaimButton: React.FC<ClaimPageProps> = ({ module }) => {
  const { address } = useWeb3();

  const [claimSuccess, setClaimSuccess] = useState(false);

  const available = useQuery(
    ["numbers", "available"],
    () => module?.totalUnclaimedSupply(),
    { enabled: !!module },
  );

  const totalAvailable = useQuery(
    ["numbers", "total"],
    () => module?.totalSupply(),
    { enabled: !!module },
  );

  const isNotSoldOut = available?.data?.gt(0);

  useEffect(() => {
    let t = setTimeout(() => setClaimSuccess(false), 3000);
    return () => clearTimeout(t);
  }, [claimSuccess]);

  const claimMutation = useMutation(
    () => {
      if (!address || !module) {
        throw new Error("No address or module");
      }
      return module.claim(1);
    },
    { onSuccess: () => queryClient.invalidateQueries("numbers") },
  );

  const isLoading = totalAvailable.isLoading || available.isLoading;

  const canClaim = isNotSoldOut && address;

  return (
    <Stack spacing={4} mt="1.5rem" align="center" w="100%">
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
            ? "Claim Drop"
            : "Claiming Unavailable"}
        </Button>
      ) : (
        <ConnectWalletButton />
      )}
      <Text size="label.md" color="green.800">
        {available.data?.eq(0)
          ? "All drops claimed"
          : `${available.data?.toString()} / ${totalAvailable.data?.toString()} available`}
      </Text>
    </Stack>
  );
};

const ClaimPage: React.FC<ClaimPageProps> = ({ module }) => {
  const { data, isLoading, error } = useQuery(
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
        <Image
          w="178px"
          h="178px"
          src={data?.metadata?.image}
          bg="#F2F0FF"
          alt={data?.metadata?.name}
          border="1px solid rgba(0,0,0,.1)"
          borderRadius="20px"
        />
        <Heading size="display.md" fontWeight="title" as="h1">
          {data?.metadata?.name}
        </Heading>
        {data?.metadata?.description && (
          <Heading noOfLines={2} as="h2" size="subtitle.md">
            {data.metadata.description}
          </Heading>
        )}
        <ClaimButton module={module} />
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

  if (!ownedDropsMetadata) {
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
}

const DropWidget: React.FC<DropWidgetProps> = ({
  startingTab = "claim",
  rpcUrl,
  contractAddress,
  chainId,
}) => {
  const [activeTab, setActiveTab] = useState(startingTab);
  const { address, provider } = useWeb3();

  const rpc = useMemo(() => {
    return rpcUrl || ChainIDToRPCMap[chainId] || null;
  }, [rpcUrl, chainId]);

  const sdk = useMemo(() => {
    if (!rpc) {
      return null;
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
    <AspectRatio ratio={1} w="600px">
      <Flex
        flexDir="column"
        borderRadius="1rem"
        overflow="hidden"
        shadow="0px 1px 1px rgba(0,0,0,0.1)"
        border="1px solid"
        borderColor="blackAlpha.10"
      >
        <Header
          activeTab={activeTab}
          setActiveTab={(tab) => setActiveTab(tab)}
          module={dropModule}
        />
        <Body>
          {activeTab === "claim" ? (
            <ClaimPage module={dropModule} />
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
            <DropWidget contractAddress={contractAddress} chainId={chainId} />
          </ThirdwebWeb3Provider>
        </ChakraProvider>
      </QueryClientProvider>
    </>
  );
};

ReactDOM.render(<App />, document.getElementById("root"));
