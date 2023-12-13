import { ChakraProvider, Flex, useColorMode, Text } from "@chakra-ui/react";
import { css, Global } from "@emotion/react";
import { ThirdwebProvider, useContract } from "@thirdweb-dev/react";
import React, { useEffect } from "react";
import { createRoot } from "react-dom/client";
import { Body } from "../shared/body";
import { ERC721ClaimButton } from "../shared/claim-button-erc721";
import { ContractMetadataPage } from "../shared/contract-metadata-page";
import { Footer } from "../shared/footer";
import { Header } from "../shared/header";
import { useGasless } from "../shared/hooks/useGasless";
import chakraTheme from "../shared/theme";
import { fontsizeCss } from "../shared/theme/typography";

interface Erc721EmbedProps {
  contractAddress: string;
  colorScheme: "light" | "dark";
  primaryColor: string;
}

const Erc721Embed: React.FC<Erc721EmbedProps> = ({
  contractAddress,
  colorScheme,
  primaryColor,
}) => {
  const { setColorMode } = useColorMode();
  const { contract } = useContract(contractAddress);

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
        <ContractMetadataPage contract={contract}>
          <ERC721ClaimButton
            contract={contract}
            colorScheme={colorScheme}
            primaryColor={primaryColor}
          />
        </ContractMetadataPage>
      </Body>
      <Footer />
    </Flex>
  );
};

const urlParams = new URL(window.location.toString()).searchParams;

const App: React.FC = () => {
  const _chain = urlParams.get("chain");
  const chain =
    _chain && _chain?.startsWith("{")
      ? JSON.parse(String(_chain))
      : _chain?.startsWith("%7B")
      ? JSON.parse(decodeURIComponent(_chain))
      : _chain || "";
  const contractAddress = urlParams.get("contract") || "";
  const relayerUrl = urlParams.get("relayUrl") || "";
  const biconomyApiKey = urlParams.get("biconomyApiKey") || "";
  const biconomyApiId = urlParams.get("biconomyApiId") || "";

  let _theme = urlParams.get("theme");
  if (_theme === "system") {
    _theme = window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }
  const colorScheme = _theme === "dark" ? "dark" : "light";
  const primaryColor = urlParams.get("primaryColor") || "purple";

  const sdkOptions = useGasless(relayerUrl, biconomyApiKey, biconomyApiId);

  const clientId = urlParams.get("clientId") || "";
  if (!clientId) {
    return (
      <Text>Client ID is required as a query param to use this page.</Text>
    );
  }

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
          activeChain={chain}
          sdkOptions={sdkOptions}
          clientId={clientId}
        >
          <Erc721Embed
            contractAddress={contractAddress}
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
