import { ChakraProvider } from "@chakra-ui/react";
import { css, Global } from "@emotion/react";
import { ThirdwebProvider } from "@thirdweb-dev/react";
import { ThirdwebStorage } from "@thirdweb-dev/storage";
import { FC, ReactNode } from "react";

import { useGasless } from "./hooks/useGasless";
import chakraTheme from "./theme";
import { fontsizeCss } from "./theme/typography";
import { Chain, getChainBySlug } from "@thirdweb-dev/chains";

const AppLayout: FC<{ urlParams: URLSearchParams; children: ReactNode }> = ({
  urlParams,
  children,
}) => {
  const chain =
    urlParams.get("chain") && urlParams.get("chain")?.startsWith("{")
      ? JSON.parse(String(urlParams.get("chain")))
      : urlParams.get("chain");
  const tempChain = getChainBySlug(
    typeof chain === "string" ? chain : chain.slug,
  );
  const activeChain: Chain | string =
    typeof chain === "string" ? chain : { ...chain, icon: tempChain.icon };
  const relayerUrl = urlParams.get("relayUrl") || "";
  const biconomyApiKey = urlParams.get("biconomyApiKey") || "";
  const biconomyApiId = urlParams.get("biconomyApiId") || "";
  const ipfsGateway = urlParams.get("ipfsGateway");
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
          activeChain={activeChain}
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
        >
          {children}
        </ThirdwebProvider>
      </ChakraProvider>
    </>
  );
};

export default AppLayout;
