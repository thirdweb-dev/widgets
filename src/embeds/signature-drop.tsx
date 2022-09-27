import {
  ChakraProvider,
  ColorMode,
  Flex,
  useColorMode,
} from "@chakra-ui/react";
import { css, Global } from "@emotion/react";
import { ThirdwebProvider, useContract } from "@thirdweb-dev/react";
import type { SignatureDrop } from "@thirdweb-dev/sdk";
import { ThirdwebStorage } from "@thirdweb-dev/storage";
import React, { useEffect } from "react";
import { createRoot } from "react-dom/client";
import { ContractMetadataPage } from "../shared/contract-metadata-page";
import { ERC721ClaimButton } from "../shared/claim-button-erc721";
import { Footer } from "../shared/footer";
import { Header } from "../shared/header";
import chakraTheme from "../shared/theme";
import { fontsizeCss } from "../shared/theme/typography";
import { parseIpfsGateway } from "../utils/parseIpfsGateway";
import { useGasless } from "../shared/hooks/useGasless";
import { Body } from "src/shared/body";

interface SignatureDropEmbedProps {
  contractAddress: string;
  colorScheme: ColorMode;
  primaryColor: string;
}

const SignatureDropEmbed: React.FC<SignatureDropEmbedProps> = ({
  contractAddress,
  colorScheme,
  primaryColor,
}) => {
  const { setColorMode } = useColorMode();
  const { contract: sigDrop } = useContract<SignatureDrop>(contractAddress);

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
        <ContractMetadataPage contract={sigDrop}>
          <ERC721ClaimButton
            contract={sigDrop}
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
  const chainId = Number(urlParams.get("chainId"));
  const contractAddress = urlParams.get("contract") || "";
  const rpcUrl = urlParams.get("rpcUrl") || "";
  const relayerUrl = urlParams.get("relayUrl") || "";
  const biconomyApiKey = urlParams.get("biconomyApiKey") || "";
  const biconomyApiId = urlParams.get("biconomyApiId") || "";
  const colorScheme = urlParams.get("theme") === "dark" ? "dark" : "light";
  const primaryColor = urlParams.get("primaryColor") || "purple";

  const ipfsGateway = parseIpfsGateway(urlParams.get("ipfsGateway") || "");

  const sdkOptions = useGasless(relayerUrl, biconomyApiKey, biconomyApiId);

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
          <SignatureDropEmbed
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
