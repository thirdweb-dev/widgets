import { NFTMetadata } from "@3rdweb/sdk";
import React, { useCallback, useState } from "react";
import {
  Flex,
  Heading,
  Image,
  Stack,
  AspectRatio,
  Box,
  IconButton,
  Center,
} from "@chakra-ui/react";
import { ChevronRightIcon, ChevronLeftIcon } from "@chakra-ui/icons";

interface NftCarouselProps {
  metadata: NFTMetadata[];
}

export const NftCarousel: React.FC<NftCarouselProps> = ({ metadata }) => {
  const arrayLength = metadata.length;
  const [currentIndex, setCurrentIndex] = useState(0);

  const next = useCallback(() => {
    setCurrentIndex((val) => {
      let next = val + 1;
      if (next >= arrayLength) {
        next = 0;
      }
      return next;
    });
  }, [arrayLength]);
  const prev = useCallback(() => {
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
      <AspectRatio ratio={1} w="75%">
        <Flex py={4} position="relative" overflow="hidden">
          {metadata.map((nft, idx) => (
            <Stack
              key={nft.id}
              justify="center"
              align="center"
              w="100%"
              position="absolute"
              left={"calc(100% * " + idx + ")"}
              transform={`translateX(${currentIndex * -100}%)`}
              transition="transform .333s ease"
            >
              <AspectRatio ratio={1} w="80%">
                <Box
                  borderRadius="lg"
                  overflow="hidden"
                  border="1px solid rgba(0, 0, 0, 0.1);"
                  padding={4}
                >
                  <Image
                    w="100%"
                    h="100%"
                    objectFit="contain"
                    src={nft.image}
                    alt={nft.name}
                  />
                </Box>
              </AspectRatio>
              <Heading fontWeight={500} fontSize="18px" size="sm" as="h3">
                {nft.name}
              </Heading>
            </Stack>
          ))}
          <IconButton
            aria-label="next"
            icon={<ChevronRightIcon />}
            onClick={next}
            borderRadius="full"
            variant="ghost"
            position="absolute"
            top="50%"
            right="5px"
            transform="translateY(-50%)"
          />
          <IconButton
            aria-label="previous"
            icon={<ChevronLeftIcon />}
            onClick={prev}
            borderRadius="full"
            variant="ghost"
            position="absolute"
            top="50%"
            left="5px"
            transform="translateY(-50%)"
          />
        </Flex>
      </AspectRatio>
    </Center>
  );
};
