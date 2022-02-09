import { ChevronDownIcon } from "@chakra-ui/icons";
import {
  Alert,
  AlertDescription,
  AlertIcon,
  Button,
  Flex,
  Icon,
  Image,
  Menu,
  MenuButton,
  MenuList,
  Stack,
  Text,
} from "@chakra-ui/react";
import React from "react";
import { IoSwapHorizontalSharp } from "react-icons/io5";
import { FiInfo } from "react-icons/fi";
import { useConnect, useNetwork } from "wagmi";
import { ChainIDToName, supportedChains } from "./commonRPCUrls";

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
  const [{ data, error: connectError, loading }, connect] = useConnect();

  if (networkData.chain && expectedChainId !== networkData?.chain?.id) {
    if (switchNetwork) {
      return (
        <Stack w="100%">
          <Button
            isFullWidth
            colorScheme="orange"
            borderRadius="md"
            leftIcon={<IoSwapHorizontalSharp />}
            onClick={() => switchNetwork(expectedChainId)}
          >
            Switch Network To {ChainIDToName[expectedChainId]}
          </Button>
          <Stack
            w="100%"
            direction="row"
            bg={`orange.50`}
            borderRadius="md"
            borderWidth="1px"
            borderColor={`orange.100`}
            align="center"
            padding="10px"
            spacing={3}
          >
            <Icon as={FiInfo} color={`orange.400`} boxSize={6} />
            <Stack>
              <Text color={`orange.800`}>
                You are currently connected to the wrong network. Please switch your network to continue.
              </Text>
              <Text color={`orange.800`}>
                If you are using wallet connect or coinbase wallet, you may need to manually switch networks on your app.
              </Text>
            </Stack>
          </Stack>
        </Stack>
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
