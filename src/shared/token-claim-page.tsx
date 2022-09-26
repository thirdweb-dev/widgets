import {
  Center,
  Flex,
  Grid,
  Heading,
  Icon,
  Skeleton,
  Text,
} from "@chakra-ui/react";
import { ThirdwebNftMedia, useNFT } from "@thirdweb-dev/react";
import React from "react";
import { DropSvg } from "./svg/drop";

interface TokenClaimPageProps {
  query: ReturnType<typeof useNFT>;
}

export const TokenClaimPage: React.FC<
  React.PropsWithChildren<TokenClaimPageProps>
> = ({ query, children }) => {
  const { data: nft, isLoading } = query;

  return (
    <Center w="100%" h="100%">
      <Flex direction="column" align="center" gap={4} w="100%">
        <Skeleton isLoaded={!isLoading} borderRadius="20px" overflow="hidden">
          <Grid
            bg="#F2F0FF"
            border="1px solid rgba(0,0,0,.1)"
            borderRadius="20px"
            w="178px"
            h="178px"
            placeContent="center"
            overflow="hidden"
          >
            {nft?.metadata ? (
              <ThirdwebNftMedia metadata={nft?.metadata} />
            ) : (
              <Icon maxW="100%" maxH="100%" as={DropSvg} />
            )}
          </Grid>
        </Skeleton>
        <Skeleton isLoaded={!isLoading}>
          <Heading fontSize={32} fontWeight="title" as="h1">
            {isLoading ? "Loading..." : nft?.metadata?.name}
          </Heading>
        </Skeleton>
        <Skeleton isLoaded={!isLoading}>
          {(nft?.metadata?.description || isLoading) && (
            <Text noOfLines={2} as="h2" fontSize={16}>
              {isLoading
                ? "Loading Description..."
                : nft?.metadata?.description}
            </Text>
          )}
        </Skeleton>
        {children}
      </Flex>
    </Center>
  );
};
