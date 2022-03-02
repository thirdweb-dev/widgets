import { ChevronLeftIcon, ChevronRightIcon } from "@chakra-ui/icons";
import {
  AspectRatio,
  Box,
  BoxProps,
  Center,
  Flex,
  Heading,
  IconButton,
  Image,
  Stack,
  Text,
} from "@chakra-ui/react";
import { NFTMetadata } from "@thirdweb-dev/sdk";
import React, { useCallback, useState } from "react";
import { isExtensionVideoFile } from "../utils/isExtensionVideoFile";
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
                left={"calc(100% * " + idx + ")"}
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
                  <NFTImageOrVideo
                    animation_url={nft.animation_url}
                    image={nft.image}
                    title={nft.name}
                  />
                </AspectRatio>
                <Heading fontWeight={500} fontSize="18px" size="sm" as="h3">
                  {nft.name}
                </Heading>
                {nft.supply && (
                  <Text>
                    <strong>Quantity:</strong> {nft.supply}
                  </Text>
                )}
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
          size="sm"
        />
      </Stack>
    </Center>
  );
};

interface NFTImageOrVideoProps extends BoxProps {
  animation_url?: string;
  image?: string;
  title?: string;
}

export const NFTImageOrVideo: React.FC<NFTImageOrVideoProps> = ({
  animation_url,
  image,
  title,
  children,
  ...restBoxProps
}) => {
  if (animation_url && isExtensionVideoFile(animation_url)) {
    return (
      <Box
        as="video"
        //@ts-ignore
        objectFit="contain!important"
        autoPlay
        loop
        playsInline
        muted
        src={animation_url}
        poster={image}
        {...restBoxProps}
      />
    );
  } else {
    return (
      <Image
        //@ts-ignore
        objectFit="contain!important"
        src={image}
        alt={title || "NFT"}
        {...restBoxProps}
      />
    );
  }
};
