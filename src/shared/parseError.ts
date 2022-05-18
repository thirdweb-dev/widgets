export const parseError = (err: any) => {
  // Explicity error recognition
  if (err.code === "INSUFFICIENT_FUNDS") {
    return "Insufficient funds to mint";
  } else if (err.code === "UNPREDICTABLE_GAS_LIMIT") {
    if (err.message.includes("exceed max mint supply")) {
      return "Your transaction failed because you attempted to mint more tokens than the maximum allowed mint supply";
    }
  } else if (err.message.includes("User denied transaction signature")) {
    return "You denied the transaction";
  }

  if (err.data.message.includes("execution reverted:")) {
    return err.data.message.replace("execution reverted:", "");
  }

  if (err.data.message) {
    return err.data.message;
  }

  return undefined;
};
