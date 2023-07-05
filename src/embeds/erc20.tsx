import { Flex, useColorMode } from "@chakra-ui/react";
import { useContract } from "@thirdweb-dev/react";
import React, { useEffect } from "react";
import { createRoot } from "react-dom/client";
import { Body } from "src/shared/body";
import { ERC20ClaimButton } from "src/shared/claim-button-erc20";
import { ContractMetadataPage } from "src/shared/contract-metadata-page";
import { Header } from "src/shared/header";
import { Footer } from "../shared/footer";
import AppLayout from "src/shared/app-layout";
import { BaseEmbedProps } from "src/shared/types/base";

interface Erc20EmbedProps extends BaseEmbedProps {}

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
  const contractAddress = urlParams.get("contract") || "";
  const colorScheme = urlParams.get("theme") === "dark" ? "dark" : "light";
  const primaryColor = urlParams.get("primaryColor") || "purple";
  return (
    <AppLayout urlParams={urlParams}>
      <Erc20Embed
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
