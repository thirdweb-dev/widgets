import { Stack } from "@chakra-ui/react";
import React from "react";
import { ConnectedWallet } from "./connected-wallet";

interface HeaderProps {
  tokenAddress?: string;
}

export const Header: React.FC<HeaderProps> = ({ tokenAddress }) => {
  return (
    <Stack
      as="header"
      px="28px"
      direction="row"
      spacing="20px"
      w="100%"
      flexGrow={0}
      borderBottom="1px solid rgba(0,0,0,.1)"
      justify="flex-end"
      py={2}
    >
      <ConnectedWallet tokenAddress={tokenAddress} />
    </Stack>
  );
};
