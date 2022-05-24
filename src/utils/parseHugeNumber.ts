import { BigNumber, BigNumberish } from "ethers";

export function parseHugeNumber(totalAvailable: BigNumberish = 0) {
  if (totalAvailable === "unlimited") {
    return "Unlimited";
  }

  const bn = BigNumber.from(totalAvailable);
  if (bn.gte(Number.MAX_SAFE_INTEGER - 1)) {
    return "Unlimited";
  }
  const number = bn.toNumber();
  return new Intl.NumberFormat(undefined, {
    notation: bn.gte(1_00_000) ? "compact" : undefined,
  }).format(number);
}
