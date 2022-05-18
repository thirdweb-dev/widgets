import { Button, ButtonProps, Stack, Tab } from "@chakra-ui/react";
import React from "react";
import { ConnectedWallet } from "./connected-wallet";

type Tab = "claim" | "inventory";

const activeButtonProps: ButtonProps = {
  borderBottom: "4px solid",
  borderBottomColor: "blue.500",
};

const inactiveButtonProps: ButtonProps = {
  color: "gray.500",
};

interface HeaderProps {
  expectedChainId: number;
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  tokenAddress?: string;
  available?: string;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  tokenAddress,
  available,
}) => {
  return (
    <Stack
      as="header"
      px="28px"
      direction="row"
      spacing="20px"
      w="100%"
      flexGrow={0}
      borderBottom="1px solid rgba(0,0,0,.1)"
      justify="space-between"
    >
      <Stack direction="row" spacing={5}>
        <Button
          h="48px"
          fontSize="subtitle.md"
          fontWeight="700"
          borderY="4px solid transparent"
          {...(activeTab === "claim" ? activeButtonProps : inactiveButtonProps)}
          variant="unstyled"
          borderRadius={0}
          onClick={() => setActiveTab("claim")}
        >
          Mint{available ? ` (${available})` : ""}
        </Button>
        <Button
          h="48px"
          fontSize="subtitle.md"
          fontWeight="700"
          borderY="4px solid transparent"
          {...(activeTab === "inventory"
            ? activeButtonProps
            : inactiveButtonProps)}
          variant="unstyled"
          borderRadius={0}
          onClick={() => setActiveTab("inventory")}
        >
          Inventory
        </Button>
      </Stack>
      <ConnectedWallet tokenAddress={tokenAddress} />
    </Stack>
  );
};
