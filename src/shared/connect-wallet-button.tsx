import { useSwitchNetwork, useWeb3 } from "@3rdweb/hooks";
import { ConnectWallet } from "@3rdweb/react";
import { Button } from "@chakra-ui/react";
import { UnsupportedChainIdError } from "@web3-react/core";
import React from "react";
import { IoSwapHorizontalSharp } from "react-icons/io5";

interface ConnectWalletButtonProps {
  expextedChainId: number;
}

export const ConnectWalletButton: React.FC<ConnectWalletButtonProps> = ({
  expextedChainId,
}) => {
  const { error } = useWeb3();
  const { switchNetwork } = useSwitchNetwork();

  if (error && error instanceof UnsupportedChainIdError && expextedChainId) {
    return (
      <Button
        isFullWidth
        colorScheme="orange"
        borderRadius="md"
        leftIcon={<IoSwapHorizontalSharp />}
        onClick={() => switchNetwork(expextedChainId)}
      >
        Switch Network
      </Button>
    );
  }
  return <ConnectWallet isFullWidth colorScheme="blue" borderRadius="md" />;
};
