import { Flex, useColorMode } from "@chakra-ui/react";
import { useContract } from "@thirdweb-dev/react";
import React, { useEffect } from "react";
import { createRoot } from "react-dom/client";
import { Body } from "../shared/body";
import { ERC721ClaimButton } from "../shared/claim-button-erc721";
import { ContractMetadataPage } from "../shared/contract-metadata-page";
import { Footer } from "../shared/footer";
import { Header } from "../shared/header";
import AppLayout from "src/shared/app-layout";
import { BaseEmbedProps } from "src/shared/types/base";

interface Erc721EmbedProps extends BaseEmbedProps {}

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
  const contractAddress = urlParams.get("contract") || "";
  const colorScheme = urlParams.get("theme") === "dark" ? "dark" : "light";
  const primaryColor = urlParams.get("primaryColor") || "purple";
  return (
    <AppLayout urlParams={urlParams}>
      <Erc721Embed
        contractAddress={contractAddress}
        colorScheme={colorScheme}
        primaryColor={primaryColor}
      />
    </AppLayout>
  );
};

const container = document.getElementById("root") as Element;
const root = createRoot(container);
root.render(<App />);
