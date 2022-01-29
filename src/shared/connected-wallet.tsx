import { Button, Icon } from "@chakra-ui/react";
import { IoWalletOutline } from "react-icons/io5";
import { useAccount } from "wagmi";
import { useAddress } from "./useAddress";

export const ConnectedWallet: React.FC = () => {
  const [{ data }, disconnect] = useAccount();

  if (!data?.address) {
    return null;
  }

  return (
    <>
      <Button 
        variant="outline"
        size="sm"
        color="gray.800"
        leftIcon={<Icon as={IoWalletOutline} color="gray.500" boxSize={4} />}
      >
        {data?.address?.slice(0, 6)}...{data?.address?.slice(-4)}
      </Button>
      <Button colorScheme="red" size="sm" onClick={disconnect}>
        Disconnect
      </Button>
    </>
  )
}