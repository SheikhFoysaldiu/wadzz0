import { WalletType } from "package/connect_wallet";
import { z } from "zod";

export const albedoSchema = z.object({
  walletType: z.literal(WalletType.albedo),
  pubkey: z.string(),
  signature: z.string(),
  token: z.string(),
});

const emailPassSchema = z.object({
  walletType: z.literal(WalletType.emailPass),
  email: z.string(),
  password: z.string(),
});

export const providerAuthShema = z.object({
  email: z.string(),
  token: z.string(),
  walletType: z.literal(WalletType.google || WalletType.facebook),
});

export const authCredentialSchema = z.union([
  albedoSchema,
  emailPassSchema,
  providerAuthShema,
]);

export type AuthCredentialType = z.infer<typeof authCredentialSchema>;
