import { ChevronDownIcon } from "@chakra-ui/icons";
import {
  Alert,
  AlertDescription,
  AlertIcon,
  Button,
  Flex,
  Image,
  Menu,
  MenuButton,
  MenuList,
  Text,
} from "@chakra-ui/react";
import React from "react";
import { IoSwapHorizontalSharp } from "react-icons/io5";
import { useConnect, useNetwork } from "wagmi";
import { supportedChains } from "./commonRPCUrls";

interface ConnectWalletButtonProps {
  expectedChainId: number;
}

const connectorIdToImageUrl: Record<string, string> = {
  injected: "https://thirdweb.com/logos/metamask-fox.svg",
  walletConnect: "https://thirdweb.com/logos/walletconnect-logo.svg",
  walletLink: "https://thirdweb.com/logos/coinbase-wallet-logo.svg",
};

export const ConnectWalletButton: React.FC<ConnectWalletButtonProps> = ({
  expectedChainId,
}) => {
  const [{ data: networkData, error: networkError }, switchNetwork] =
    useNetwork();
  const [{ data, error: connectErrror, loading }, connect] = useConnect();

  if (networkData.chain && expectedChainId !== networkData?.chain?.id) {
    if (switchNetwork) {
      return (
        <Button
          isFullWidth
          colorScheme="orange"
          borderRadius="md"
          leftIcon={<IoSwapHorizontalSharp />}
          onClick={() => switchNetwork(expectedChainId)}
        >
          Switch Network
        </Button>
      );
    }
    return (
      <Alert variant="left-accent" status="warning">
        <AlertIcon />

        <AlertDescription>
          <Text>You wallet is connected to the wrong network.</Text>
          {expectedChainId && (
            <Text>
              Please switch your wallet to{" "}
              <strong>
                {supportedChains.find((c) => c.id === expectedChainId)?.name}
              </strong>
              .
            </Text>
          )}
        </AlertDescription>
      </Alert>
    );
  }
  let isMounted = true;
  return (
    <Menu matchWidth>
      <MenuButton
        isLoading={loading}
        as={Button}
        colorScheme="blue"
        borderRadius="md"
        isFullWidth
        rightIcon={<ChevronDownIcon />}
      >
        Connect Wallet
      </MenuButton>

      <MenuList>
        <Flex direction={{ base: "column", md: "row" }} gap={2} px={3}>
          {data.connectors.map((_connector) => (
            <Button
              flexGrow={1}
              size="sm"
              variant="outline"
              key={_connector.name}
              isLoading={loading && data?.connector?.name === _connector?.name}
              isDisabled={!_connector.ready}
              onClick={() => connect(_connector)}
              leftIcon={
                <Image
                  maxWidth={6}
                  src={connectorIdToImageUrl[_connector.id]}
                  alt={_connector.name}
                />
              }
            >
              {_connector.name}
              {isMounted ? !_connector.ready && " (unsupported)" : ""}
            </Button>
          ))}
        </Flex>
      </MenuList>
    </Menu>
  );
};
