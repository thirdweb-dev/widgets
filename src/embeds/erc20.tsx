import { ChakraProvider, Flex, useColorMode, Text } from "@chakra-ui/react";
import { css, Global } from "@emotion/react";
import { ThirdwebProvider, useContract } from "@thirdweb-dev/react";
import React, { useEffect } from "react";
import { createRoot } from "react-dom/client";
import { Body } from "src/shared/body";
import { ERC20ClaimButton } from "src/shared/claim-button-erc20";
import { ContractMetadataPage } from "src/shared/contract-metadata-page";
import { Header } from "src/shared/header";
import { Footer } from "../shared/footer";
import { useGasless } from "../shared/hooks/useGasless";
import chakraTheme from "../shared/theme";
import { fontsizeCss } from "../shared/theme/typography";

interface Erc20EmbedProps {
  colorScheme: "light" | "dark";
  primaryColor: string;
  contractAddress: string;
}
const Erc20Embed: React.FC<Erc20EmbedProps> = ({
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
          <ERC20ClaimButton
            contract={contract}
            primaryColor={primaryColor}
            colorScheme={colorScheme}
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

  const colorScheme = urlParams.get("theme") === "dark" ? "dark" : "light";
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
          <Erc20Embed
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
