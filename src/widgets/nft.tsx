import React, { useEffect, useMemo, useState } from "react";
import ReactDOM from "react-dom";
import {
  ChakraProvider,
  Flex,
  Heading,
  Image,
  Stack,
  AspectRatio,
  Box,
  IconButton,
} from "@chakra-ui/react";
import { ThirdwebWeb3Provider, useWeb3 } from "@3rdweb/hooks";
import { PoweredBy } from "../shared/powered-by";
import { ConnectWallet } from "@3rdweb/react";
import { ThirdwebSDK, NFTMetadata, ModuleMetadata } from "@3rdweb/sdk";
import { ChevronRightIcon, ChevronLeftIcon } from "@chakra-ui/icons";

const connectors = {
  injected: {},
};

const Providers: React.FC = () => {
  return (
    <ThirdwebWeb3Provider supportedChainIds={[137]} connectors={connectors}>
      <ChakraProvider>
        <App />
      </ChakraProvider>
    </ThirdwebWeb3Provider>
  );
};

const App: React.FC = () => {
  return <Layout title="Foo Bar" />;
};

export default function runNFT() {
  ReactDOM.render(<Providers />, document.getElementById("root"));
}

interface LayoutProps {
  title: string;
}

const Layout: React.FC<LayoutProps> = ({ title }) => {
  const { address, provider } = useWeb3();

  const collection = useMemo(() => {
    if (!provider) {
      return null;
    }
    return new ThirdwebSDK(provider).getNFTModule(
      "0x294261Ce5C5A5F8a709E1cA94D15b954bB42C2C8"
    );
  }, [provider]);

  const [owned, setOwned] = useState<NFTMetadata[]>([]);
  const [metadata, setMetadata] = useState<ModuleMetadata>(undefined);

  useEffect(() => {
    let __mounted = true;
    const getAsyncData = async () => {
      const _owned = await collection.getOwned(address);
      const _metadata = await collection.getMetadata();
      if (__mounted) {
        setOwned(_owned);
        setMetadata(_metadata);
      }
    };
    if (address) {
      getAsyncData();
    }
    return () => {
      __mounted = false;
    };
  }, [collection, address]);

  const [currentIndex, setCurrentIndex] = useState(0);

  const next = () => {
    setCurrentIndex((val) => {
      let next = val + 1;
      if (next >= owned.length) {
        next = 0;
      }
      return next;
    });
  };
  const prev = () => {
    setCurrentIndex((val) => {
      let prev = val - 1;
      if (prev < 0) {
        prev = owned.length - 1;
      }
      return prev;
    });
  };

  return (
    <Flex flexDir="column" w="100vw" h="100vh" px={10} pb={10}>
      <Flex
        as="header"
        flexShrink={0}
        py={4}
        justify="space-between"
        align="center"
      >
        <Heading as="h1">{metadata?.metadata?.name || ""}</Heading>
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
        {owned.map((nft, idx) => (
          <Stack
            key={nft.id}
            justify="center"
            align="center"
            w="100%"
            position="absolute"
            left={"calc(100% * " + idx + ")"}
            transform={`translateX(${currentIndex * -100}%)`}
            transition="transform .5s ease"
          >
            <AspectRatio ratio={1} w="80%">
              <Box
                borderRadius="lg"
                overflow="hidden"
                bg="black"
                border="1px solid rgba(0, 0, 0, 0.1);"
              >
                <Image
                  w="100%"
                  h="100%"
                  objectFit="contain"
                  src={nft.image}
                  alt={nft.name}
                />
              </Box>
            </AspectRatio>
            <Heading fontWeight={500} fontSize="18px" size="sm" as="h3">
              {nft.name}
            </Heading>
          </Stack>
        ))}
        <IconButton
          aria-label="next"
          icon={<ChevronRightIcon />}
          onClick={next}
          borderRadius="full"
          variant="ghost"
          position="absolute"
          top="50%"
          right="5px"
          transform="translateY(-50%)"
        />
        <IconButton
          aria-label="previous"
          icon={<ChevronLeftIcon />}
          onClick={prev}
          borderRadius="full"
          variant="ghost"
          position="absolute"
          top="50%"
          left="5px"
          transform="translateY(-50%)"
        />
      </Flex>
      <Flex as="footer" flexShrink={0} py={4} justify="flex-end">
        <PoweredBy />
      </Flex>
    </Flex>
  );
};
