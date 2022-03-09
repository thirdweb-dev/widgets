import { ClaimEligibility } from "@thirdweb-dev/sdk";

export function parseIneligibility(reasons: ClaimEligibility[]): string {
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
    return "You don't have enough tokens to claim this drop.";
  } else if (reason === ClaimEligibility.AddressNotAllowed) {
    return "You are not on the allow list for this drop.";
  }

  return reason;
}