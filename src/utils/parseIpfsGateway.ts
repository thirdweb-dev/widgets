export function parseIpfsGateway(ipfsGateway: string) {
  if (ipfsGateway) {
    return ipfsGateway;
  }

  if (window.location.origin.includes(".ipfs.")) {
    const origin = window.location.origin.split(".ipfs.")[1];
    return `https://${origin}/ipfs/`;
  } else if (
    window.location.origin.startsWith("http") &&
    window.location.pathname.startsWith("/ipfs/")
  ) {
    ipfsGateway = `${window.location.origin}/ipfs/`;
  }

  return "";
}
