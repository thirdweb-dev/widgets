import {
  ChakraProvider,
  ColorMode,
  Flex,
  useColorMode,
} from "@chakra-ui/react";
import { css, Global } from "@emotion/react";
import { ThirdwebProvider, useContract, useNFT } from "@thirdweb-dev/react";
import { EditionDrop } from "@thirdweb-dev/sdk";
import { ThirdwebStorage } from "@thirdweb-dev/storage";
import React, { useEffect, useMemo } from "react";
import { createRoot } from "react-dom/client";
import { ERC1155ClaimButton } from "src/shared/claim-button-erc1155";
import { TokenClaimPage } from "../shared/token-claim-page";
import { Footer } from "../shared/footer";
import { Header } from "../shared/header";
import chakraTheme from "../shared/theme";
import { fontsizeCss } from "../shared/theme/typography";
import { parseIpfsGateway } from "../utils/parseIpfsGateway";

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

interface EditionDropEmbedProps {
  contractAddress: string;
  tokenId: string;
  colorScheme: ColorMode;
  primaryColor: string;
}

const EditionDropEmbed: React.FC<EditionDropEmbedProps> = ({
  contractAddress,
  tokenId,
  colorScheme,
  primaryColor,
}) => {
  const { setColorMode } = useColorMode();
  const { contract: editionDrop } = useContract<EditionDrop>(contractAddress);
  const { data: nft, isLoading } = useNFT(editionDrop, tokenId);

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
        <TokenClaimPage metadata={nft?.metadata} isLoading={isLoading}>
          <ERC1155ClaimButton
            contract={editionDrop}
            tokenId={tokenId}
            primaryColor={primaryColor}
            colorScheme={colorScheme}
          />
        </TokenClaimPage>
      </Body>
      <Footer />
    </Flex>
  );
};

const urlParams = new URL(window.location.toString()).searchParams;

const App: React.FC = () => {
  const chainId = Number(urlParams.get("chainId"));
  const contractAddress = urlParams.get("contract") || "";
  const rpcUrl = urlParams.get("rpcUrl") || "";
  const tokenId = urlParams.get("tokenId") || "0";
  const relayerUrl = urlParams.get("relayUrl") || "";

  const ipfsGateway = parseIpfsGateway(urlParams.get("ipfsGateway") || "");

  const colorScheme = urlParams.get("theme") === "dark" ? "dark" : "light";
  const primaryColor = urlParams.get("primaryColor") || "purple";

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
          desiredChainId={chainId}
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
          chainRpc={{ [chainId]: rpcUrl }}
        >
          <EditionDropEmbed
            contractAddress={contractAddress}
            tokenId={tokenId}
            colorScheme={colorScheme}
            primaryColor={primaryColor}
          />
        </ThirdwebProvider>
      </ChakraProvider>
    </>
  );
};

const container = document.getElementById("root") as Element;
const root = createRoot(container);
root.render(<App />);
