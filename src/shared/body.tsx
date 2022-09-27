import { Flex } from "@chakra-ui/react";
import React from "react";

export const Body: React.FC<React.PropsWithChildren> = ({ children }) => {
  return (
    <Flex as="main" px="28px" w="100%" flexGrow={1}>
      {children}
    </Flex>
  );
};
