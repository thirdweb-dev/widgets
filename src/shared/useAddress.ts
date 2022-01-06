import { useMemo } from "react";
import { useAccount } from "wagmi";

export function useAddress() {
  const [{ data }] = useAccount();
  return useMemo(() => data?.address, [data]);
}
