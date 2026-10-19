function statesMatch(localValue: unknown, cloudValue: unknown): boolean {
  if (Object.is(localValue, cloudValue)) return true
  if (localValue === null || cloudValue === null) return false
  if (typeof localValue !== 'object' || typeof cloudValue !== 'object') return false

  if (Array.isArray(localValue) || Array.isArray(cloudValue)) {
    if (!Array.isArray(localValue) || !Array.isArray(cloudValue)) return false
    return (
      localValue.length === cloudValue.length &&
      localValue.every((value, index) => statesMatch(value, cloudValue[index]))
    )
  }

  const localRecord = localValue as Record<string, unknown>
  const cloudRecord = cloudValue as Record<string, unknown>
  const localKeys = Object.keys(localRecord).filter((key) => key !== '_m')
  const cloudKeys = Object.keys(cloudRecord).filter((key) => key !== '_m')

  return (
    localKeys.length === cloudKeys.length &&
    localKeys.every(
      (key) =>
        Object.prototype.hasOwnProperty.call(cloudRecord, key) &&
        statesMatch(localRecord[key], cloudRecord[key]),
    )
  )
}

export function cloudStatesMatch(
  localState: Record<string, unknown>,
  cloudState: Record<string, unknown>,
): boolean {
  return statesMatch(localState, cloudState)
}

export function nextCloudRevision(
  localModified: number,
  cloudModified: number,
  now: number,
): number {
  const revisions = [localModified, cloudModified, now].map((value) => {
    if (!Number.isFinite(value) || value < 0 || value === Number.MAX_VALUE) return 0
    return Math.floor(value)
  })
  const latest = Math.max(0, ...revisions)
  const next = latest + 1

  if (Number.isFinite(next) && Number.isInteger(next) && next > latest) return next

  const largerStep = latest + Math.max(1, latest * Number.EPSILON)
  return Number.isFinite(largerStep) && largerStep > latest ? Math.ceil(largerStep) : 1
}
