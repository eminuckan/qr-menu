import "server-only"

import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto"

const ENCRYPTED_PREFIX = "enc:v1:"

function getEncryptionKey() {
  const secret = process.env.ADISYO_CREDENTIALS_ENCRYPTION_KEY

  if (!secret) {
    return null
  }

  if (/^[a-f0-9]{64}$/i.test(secret)) {
    return Buffer.from(secret, "hex")
  }

  if (secret.length >= 43) {
    try {
      const decoded = Buffer.from(secret, "base64")
      if (decoded.length === 32) {
        return decoded
      }
    } catch {
      // Fall through to hashed text key support.
    }
  }

  return createHash("sha256").update(secret).digest()
}

export function encryptAdisyoSecret(value: string) {
  const key = getEncryptionKey()

  if (!key) {
    throw new Error("ADISYO_CREDENTIALS_ENCRYPTION_KEY is required to save Adisyo credentials.")
  }

  const iv = randomBytes(12)
  const cipher = createCipheriv("aes-256-gcm", key, iv)
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()])
  const tag = cipher.getAuthTag()

  return `${ENCRYPTED_PREFIX}${Buffer.concat([iv, tag, encrypted]).toString("base64")}`
}

export function decryptAdisyoSecret(value: string) {
  if (!value.startsWith(ENCRYPTED_PREFIX)) {
    return value
  }

  const key = getEncryptionKey()

  if (!key) {
    throw new Error("ADISYO_CREDENTIALS_ENCRYPTION_KEY is required to read encrypted Adisyo credentials.")
  }

  const payload = Buffer.from(value.slice(ENCRYPTED_PREFIX.length), "base64")
  const iv = payload.subarray(0, 12)
  const tag = payload.subarray(12, 28)
  const encrypted = payload.subarray(28)
  const decipher = createDecipheriv("aes-256-gcm", key, iv)

  decipher.setAuthTag(tag)

  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8")
}
