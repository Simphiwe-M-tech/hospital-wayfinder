export function classifyScan({ path, stepIndex, currentId, destinationId, scannedId }) {
  if (scannedId === destinationId) return 'arrived'
  if (scannedId === currentId) return 'same'
  if (path.slice(stepIndex + 1).includes(scannedId)) return 'advance'
  return 'reroute'
}
