import { ClaimEligibility } from "@thirdweb-dev/sdk";

export function parseIneligibility(
  reasons: ClaimEligibility[],
  numOwned = 0,
  quantity = 0,
): string {
  if (!reasons.length) {
    return "";
  }

  const reason = reasons[0];

  if (
    reason === ClaimEligibility.Unknown ||
    reason === ClaimEligibility.NoActiveClaimPhase ||
    reason === ClaimEligibility.NoClaimConditionSet
  ) {
    return "This drop is not ready to be claimed.";
  } else if (reason === ClaimEligibility.NotEnoughTokens) {
    return "You don't have enough currency to claim.";
  } else if (reason === ClaimEligibility.AddressNotAllowed) {
    if (Number(numOwned) > 0) {
      return "You have already claimed this drop.";
    } else if (quantity > 1) {
      return `You are not allowed to claim ${quantity} NFTs.`;
    }

    return "You are not on the allowlist for this drop.";
  }

  return reason;
}
