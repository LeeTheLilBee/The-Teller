import { checkpointManifest } from "../data/checkpointManifest.js";

export function getBatchSummary() {
  const pendingPacks = checkpointManifest.completedPacks.filter((pack) => {
    const match = pack.match(/Pack (\d+)/);
    if (!match) return false;
    const number = Number(match[1]);
    return number >= 12 && number <= 21;
  });

  return {
    product: checkpointManifest.product,
    company: checkpointManifest.company,
    checkpoint: checkpointManifest.checkpoint,
    savedThrough: checkpointManifest.savedThrough,
    pendingSaveBatch: checkpointManifest.pendingSaveBatch,
    pendingPacks,
    capabilityCount: checkpointManifest.currentCapabilities.length,
    nextLikelyPack: checkpointManifest.nextLikelyPack,
  };
}
