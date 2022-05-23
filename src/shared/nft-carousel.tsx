import { ChevronLeftIcon, ChevronRightIcon } from "@chakra-ui/icons";
import {
  AspectRatio,
  Center,
  Flex,
  Heading,
  IconButton,
  Stack,
  Text,
} from "@chakra-ui/react";
import { ThirdwebNftMedia } from "@thirdweb-dev/react";
import { NFTMetadata } from "@thirdweb-dev/sdk";
import React, { useCallback, useState } from "react";

interface NFTCarouselProps {
  metadata: NFTMetadata[];
}

export const NFTCarousel: React.FC<NFTCarouselProps> = ({ metadata }) => {
  const arrayLength = metadata.length;
  const [currentIndex, setCurrentIndex] = useState(0);

  const onNext = useCallback(() => {
    setCurrentIndex((val) => {
      let next = val + 1;
      if (next >= arrayLength) {
        next = 0;
      }
      return next;
    });
  }, [arrayLength]);
  const onPrev = useCallback(() => {
    setCurrentIndex((val) => {
      let prev = val - 1;
      if (prev < 0) {
        prev = arrayLength - 1;
      }
      return prev;
    });
  }, [arrayLength]);

  return (
    <Center w="100%">
      <Stack direction="row" align="center">
        <IconButton
          aria-label="previous"
          icon={<ChevronLeftIcon />}
          onClick={onPrev}
          borderRadius="full"
          variant="outline"
          size="sm"
        />
        <AspectRatio ratio={1} w="69vw" maxW="400px">
          <Flex py={4} position="relative" overflow="hidden">
            {metadata.map((nft, idx) => (
              <Stack
                key={nft.id.toNumber()}
                justify="center"
                align="center"
                w="100%"
                position="absolute"
                left={`calc(100% * ${idx})`}
                transform={`translateX(${currentIndex * -100}%)`}
                transition="transform .333s ease"
              >
                <AspectRatio
                  ratio={1}
                  w="80%"
                  borderRadius="20px"
                  overflow="hidden"
                  border="1px solid rgba(0, 0, 0, 0.1)"
                  bg="#F2F0FF"
                >
                  <ThirdwebNftMedia metadata={nft} />
                </AspectRatio>
                <Heading fontWeight={500} fontSize="18px" size="sm" as="h3">
                  {nft.name}
                </Heading>
                {nft.supply && (
                  <Text>
                    <>
                      <strong>Quantity:</strong> {nft.supply}
                    </>
                  </Text>
                )}
              </Stack>
            ))}
          </Flex>
        </AspectRatio>
        <IconButton
          aria-label="next"
          icon={<ChevronRightIcon />}
          onClick={onNext}
          borderRadius="full"
          variant="outline"
          size="sm"
        />
      </Stack>
    </Center>
  );
};
