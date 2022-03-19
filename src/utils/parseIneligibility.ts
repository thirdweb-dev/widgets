import { ClaimEligibility } from "@thirdweb-dev/sdk";
import { BigNumber } from "ethers";

export function parseIneligibility(
  reasons: ClaimEligibility[],
  numOwned = BigNumber.from(0),
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
    if (numOwned.gt(0)) {
      return "You have already claimed this drop.";
    }

    return "You are not on the allow list for this drop.";
  }

  return reason;
}
