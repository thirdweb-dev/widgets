import { NFTMetadata } from "@3rdweb/sdk";
import { ChevronLeftIcon, ChevronRightIcon } from "@chakra-ui/icons";
import {
  AspectRatio,
  Center,
  Flex,
  Heading,
  IconButton,
  Image,
  Stack,
} from "@chakra-ui/react";
import React, { useCallback, useState } from "react";

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
      <Stack direction="row" align="center">
        <IconButton
          aria-label="previous"
          icon={<ChevronLeftIcon />}
          onClick={prev}
          borderRadius="full"
          variant="outline"
        />
        <AspectRatio ratio={1} w="69vw" maxW="400px">
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
                  <Image
                    borderRadius="20px"
                    overflow="hidden"
                    border="1px solid rgba(0, 0, 0, 0.1)"
                    bg="#F2F0FF"
                    //@ts-ignore
                    objectFit="contain!important"
                    src={nft.image}
                    alt={nft.name}
                  />
                </AspectRatio>
                <Heading fontWeight={500} fontSize="18px" size="sm" as="h3">
                  {nft.name}
                </Heading>
              </Stack>
            ))}
          </Flex>
        </AspectRatio>
        <IconButton
          aria-label="next"
          icon={<ChevronRightIcon />}
          onClick={next}
          borderRadius="full"
          variant="outline"
        />
      </Stack>
    </Center>
  );
};
