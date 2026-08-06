import { createHmac, timingSafeEqual } from "node:crypto";

type UnsubscribePayload = {
  preferenceId: string;
  version: number;
};

function signature(value: string, secret: string) {
  return createHmac("sha256", secret).update(value).digest("base64url");
}

export function createUnsubscribeToken(
  payload: UnsubscribePayload,
  secret: string,
) {
  const body = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  return `${body}.${signature(body, secret)}`;
}

export function verifyUnsubscribeToken(
  token: string,
  secret: string,
): UnsubscribePayload | null {
  const [body, received, extra] = token.split(".");
  if (!body || !received || extra) return null;
  const expected = signature(body, secret);
  const expectedBytes = Buffer.from(expected);
  const receivedBytes = Buffer.from(received);
  if (
    expectedBytes.length !== receivedBytes.length
    || !timingSafeEqual(expectedBytes, receivedBytes)
  ) return null;

  try {
    const parsed = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as Partial<UnsubscribePayload>;
    if (
      typeof parsed.preferenceId !== "string"
      || !Number.isInteger(parsed.version)
      || Number(parsed.version) < 1
    ) return null;
    return { preferenceId: parsed.preferenceId, version: Number(parsed.version) };
  } catch {
    return null;
  }
}
