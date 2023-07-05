import { Flex, useColorMode } from "@chakra-ui/react";
import { useContract, useNFT } from "@thirdweb-dev/react";
import React, { useEffect } from "react";
import { createRoot } from "react-dom/client";
import { Body } from "src/shared/body";
import { ERC1155ClaimButton } from "src/shared/claim-button-erc1155";
import { Footer } from "../shared/footer";
import { Header } from "../shared/header";
import { TokenMetadataPage } from "../shared/token-metadata-page";
import AppLayout from "src/shared/app-layout";
import { BaseEmbedProps } from "src/shared/types/base";

interface Erc1155EmbedProps extends BaseEmbedProps {
  tokenId: string;
}

const Erc1155Embed: React.FC<Erc1155EmbedProps> = ({
  contractAddress,
  tokenId,
  colorScheme,
  primaryColor,
}) => {
  const { setColorMode } = useColorMode();
  const { contract } = useContract(contractAddress);
  const { data: nft, isLoading } = useNFT(contract, tokenId);

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
        <TokenMetadataPage metadata={nft?.metadata} isLoading={isLoading}>
          <ERC1155ClaimButton
            contract={contract}
            tokenId={tokenId}
            primaryColor={primaryColor}
            colorScheme={colorScheme}
          />
        </TokenMetadataPage>
      </Body>
      <Footer />
    </Flex>
  );
};

const urlParams = new URL(window.location.toString()).searchParams;

const App: React.FC = () => {
  const contractAddress = urlParams.get("contract") || "";
  const tokenId = urlParams.get("tokenId") || "0";
  const colorScheme = urlParams.get("theme") === "dark" ? "dark" : "light";
  const primaryColor = urlParams.get("primaryColor") || "purple";
  return (
    <AppLayout urlParams={urlParams}>
      <Erc1155Embed
        contractAddress={contractAddress}
        tokenId={tokenId}
        colorScheme={colorScheme}
        primaryColor={primaryColor}
      />
    </AppLayout>
  );
};

const container = document.getElementById("root") as Element;
const root = createRoot(container);
root.render(<App />);
