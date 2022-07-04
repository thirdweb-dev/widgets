import {
  Button,
  ButtonGroup,
  Flex,
  Heading,
  Icon,
  IconButton,
  LightMode,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Stack,
  Text,
  useClipboard,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import { useAddress, useBalance, useDisconnect } from "@thirdweb-dev/react";
import React from "react";
import { IoCopy, IoWalletOutline } from "react-icons/io5";
import { RiMoneyDollarCircleLine } from "react-icons/ri";
import { useAccount } from "wagmi";

interface ConnectedWalletProps {
  tokenAddress?: string;
}

function shortenAddress(str: string) {
  return `${str.substring(0, 6)}...${str.substring(str.length - 4)}`;
}

export const ConnectedWallet: React.FC<ConnectedWalletProps> = ({
  tokenAddress,
}) => {
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure({ defaultIsOpen: false });
  const [{ data }] = useAccount();
  const address = useAddress();
  const disconnect = useDisconnect();
  const { onCopy } = useClipboard(address || "");
  const { data: balance } = useBalance(tokenAddress);

  const switchWallet = async () => {
    const provider = data?.connector?.getProvider();
    if (!provider?.isMetaMask || !provider.request) {
      return;
    }

    await provider.request({
      method: "wallet_requestPermissions",
      params: [{ eth_accounts: {} }],
    });
    onClose();
  };

  const disconnectWallet = () => {
    disconnect();
    onClose();
  };

  const copyAddress = () => {
    onCopy();
    toast({
      title: "Address copied to clipboard",
      status: "success",
      duration: 5000,
      isClosable: true,
    });
  };

  return (
    <Flex align="center" gap={2}>
      {address && (
        <>
          {balance && (
            <Stack
              direction="row"
              display={{ base: "none", md: "flex" }}
              height="32px"
              px="10px"
              borderRadius="md"
              borderColor="gray.200"
              borderWidth="1px"
              align="center"
            >
              <Icon as={RiMoneyDollarCircleLine} boxSize={4} color="gray.500" />
              <Text fontSize={14} fontWeight="semibold" whiteSpace="nowrap">
                {balance.displayValue.slice(0, 6)} {balance.symbol}
              </Text>
            </Stack>
          )}
          <Button
            variant="outline"
            size="sm"
            fontSize={14}
            leftIcon={
              <Icon as={IoWalletOutline} color="gray.500" boxSize={4} />
            }
            onClick={onOpen}
          >
            {shortenAddress(address)}
          </Button>
        </>
      )}

      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />
        <ModalContent pb={4} bg="gray.50">
          <ModalCloseButton />

          <ModalHeader>
            <Heading size="label.lg">Account Details</Heading>
          </ModalHeader>

          <ModalBody>
            <Flex direction="column" gap={5}>
              <Stack>
                <Text size="label.md" display={{ base: "flex", md: "none" }}>
                  Connected Wallet
                </Text>
                <ButtonGroup isAttached>
                  <IconButton
                    onClick={copyAddress}
                    mr="-px"
                    borderRight="none"
                    aria-label="Add to friends"
                    variant="outline"
                    fontSize={14}
                    icon={<Icon as={IoCopy} />}
                  />
                  <Button
                    fontSize={14}
                    variant="outline"
                    width="120px"
                    onClick={copyAddress}
                  >
                    {shortenAddress(address || "")}
                  </Button>
                  {data?.connector?.getProvider()?.isMetaMask && (
                    <Button fontSize={14} onClick={switchWallet}>
                      Switch
                    </Button>
                  )}
                  <LightMode>
                    <Button
                      onClick={disconnectWallet}
                      colorScheme="red"
                      fontSize={14}
                    >
                      Disconnect
                    </Button>
                  </LightMode>
                </ButtonGroup>
              </Stack>
            </Flex>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Flex>
  );
};
