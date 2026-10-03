import * as Crypto from 'expo-crypto'

export const hashPassword = async (plain: string): Promise<string> => {
  const salt = Crypto.randomUUID()
  const digest = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    `${salt}:${plain}`,
  )
  return `${salt}:${digest}`
}

export const verifyPassword = async (plain: string, stored: string): Promise<boolean> => {
  const separatorIndex = stored.indexOf(':')
  if (separatorIndex <= 0) return false

  const salt = stored.slice(0, separatorIndex)
  const expected = stored.slice(separatorIndex + 1)
  const digest = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    `${salt}:${plain}`,
  )
  return digest === expected
}
