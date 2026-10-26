import * as opaque from "@serenity-kit/opaque";

export async function opaqueReady(): Promise<void> {
  await opaque.ready;
}

export function serverSetup(): string {
  const value = process.env.OPAQUE_SERVER_SETUP;
  if (!value) throw new Error("OPAQUE_SERVER_SETUP is not configured.");
  return value;
}
