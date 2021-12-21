import { Flex } from "@chakra-ui/react";
import React from "react";
import { PoweredBy } from "./powered-by";

export const Footer: React.FC = () => {
  return (
    <Flex
      as="footer"
      justify={{ base: "center", sm: "flex-end" }}
      align="center"
      h={{ base: "36px", sm: "48px" }}
      px={{ base: "8px", sm: "28px" }}
      w="100%"
      flexGrow={0}
      flexShrink={0}
    >
      <PoweredBy />
    </Flex>
  );
};
