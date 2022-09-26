import {
  Center,
  Flex,
  Grid,
  Heading,
  Icon,
  Skeleton,
  Text,
} from "@chakra-ui/react";
import {
  DropContract,
  ThirdwebNftMedia,
  useContractMetadata,
} from "@thirdweb-dev/react";
import React from "react";
import { DropSvg } from "./svg/drop";

interface ContractMetadataPageProps {
  contract?: Exclude<DropContract, null>;
}

export const ContractMetadataPage: React.FC<
  React.PropsWithChildren<ContractMetadataPageProps>
> = ({ contract, children }) => {
  const { data: metadata, isLoading } = useContractMetadata(contract);

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
            {metadata?.image ? (
              <ThirdwebNftMedia metadata={metadata} />
            ) : (
              <Icon maxW="100%" maxH="100%" as={DropSvg} />
            )}
          </Grid>
        </Skeleton>
        <Skeleton isLoaded={!isLoading}>
          <Heading fontSize={32} fontWeight="title" as="h1">
            {isLoading ? "Loading..." : metadata?.name}
          </Heading>
        </Skeleton>
        <Skeleton isLoaded={!isLoading}>
          {(metadata?.description || isLoading) && (
            <Text noOfLines={2} as="h2" fontSize={16}>
              {isLoading ? "Loading Description..." : metadata?.description}
            </Text>
          )}
        </Skeleton>
        {children}
      </Flex>
    </Center>
  );
};
