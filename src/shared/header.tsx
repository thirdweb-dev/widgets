import { Stack } from "@chakra-ui/react";
import { ConnectWallet } from "@thirdweb-dev/react";
import React from "react";

interface HeaderProps {
  primaryColor: string;
  colorScheme: "light" | "dark";
}

export const Header: React.FC<HeaderProps> = ({ colorScheme }) => {
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
      <ConnectWallet theme={colorScheme} />
    </Stack>
  );
};
