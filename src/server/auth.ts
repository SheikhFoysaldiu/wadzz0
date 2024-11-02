/* eslint-disable */
import { verifyMessageSignature } from "@albedo-link/signature-verification";
import axios from "axios";
import { type GetServerSidePropsContext } from "next";

import {
  getServerSession,
  type DefaultSession,
  type NextAuthOptions,
} from "next-auth";

import CredentialsProvider from "next-auth/providers/credentials";

import { signInWithEmailAndPassword } from "firebase/auth";
import { WalletType } from "package/connect_wallet";
import {
  appleTokenToUserProvideUid,
  verifyIdToken,
} from "package/connect_wallet/src/lib/firebase/admin/auth";
import { auth } from "package/connect_wallet/src/lib/firebase/firebase-auth";
import { getPublicKeyAPISchema } from "package/connect_wallet/src/lib/stellar/wallet_clients/type";
import { z } from "zod";
import { db } from "~/server/db";
import { AuthCredentialType } from "~/types/auth";
import { truncateString } from "~/utils/string";

import {
  USER_ACCOUNT_URL,
  USER_ACCOUNT_URL_APPLE,
} from "package/connect_wallet/src/lib/stellar/constant";
import { verifyXDRsSignature } from "package/connect_wallet/src/lib/stellar/trx/deummy";
import { app } from "firebase-admin";

/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 *
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */
type User = DefaultSession["user"] & {
  id: string;
  walletType: WalletType;
  emailVerified: boolean;
  // ...other properties
  // role: UserRole;
};

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: User;
  }
}

/**
 * Options for NextAuth.js used to configure adapters, providers, callbacks, etc.
 *
 * @see https://next-auth.js.org/configuration/options
 */
export const authOptions: NextAuthOptions = {
  callbacks: {
    session: ({ session, token }) => {
      return {
        ...session,
        user: {
          ...session.user,
          id: token.sub,
          walletType: token.walletType,
          emailVerified: token.emailVerified,
        },
      };
    },
    jwt: ({ user, token }) => {
      const u = user as User;
      if (u) {
        token.walletType = u.walletType;
        token.emailVerified = u.emailVerified;
      }
      return token;
    },
  },
  // adapter: PrismaAdapter(db),
  session: {
    strategy: "jwt",
  },

  providers: [
    CredentialsProvider({
      type: "credentials",
      credentials: {},
      async authorize(credentials): Promise<User | null> {
        const cred = credentials as AuthCredentialType;

        console.log("cred", cred);

        // email pass login
        if (cred.walletType == WalletType.emailPass) {
          const { email, password } = cred;
          const userCredential = await signInWithEmailAndPassword(
            auth,
            email,
            password,
          );
          const user = userCredential.user;
          const data = await getUserPublicKey({ email: email, uid: user.uid });
          const sessionUser = await dbUser(data.publicKey);
          return {
            ...sessionUser,
            walletType: WalletType.emailPass,
            email: email,
            emailVerified: user.emailVerified,
          };
        }

        // wallete

        if (cred.walletType == WalletType.albedo) {
          const { pubkey, signature, token } = cred;

          const isValid = verifyMessageSignature(pubkey, token, signature);
          if (isValid) {
            const sessionUser = await dbUser(pubkey);
            return {
              ...sessionUser,
              walletType: WalletType.albedo,
              emailVerified: true,
            };
          }
          throw new Error("Invalid signature");
        }
        // wallete rabet and frieghter
        if (
          cred.walletType == WalletType.rabet ||
          cred.walletType == WalletType.frieghter ||
          cred.walletType == WalletType.walletConnect
        ) {
          const { pubkey, signedXDR } = cred;
          const isValid = await verifyXDRsSignature({
            publicKey: pubkey,
            xdr: signedXDR,
          });
          if (isValid) {
            const sessionUser = await dbUser(pubkey);
            return {
              ...sessionUser,
              walletType: cred.walletType,
              emailVerified: true,
            };
          }
          throw new Error("Invalid signature");
        }

        // provider logins
        if (
          cred.walletType == WalletType.google ||
          cred.walletType == WalletType.facebook
        ) {
          const { token, email } = cred;

          const { uid } = await verifyIdToken(token);
          const data = await getUserPublicKey({ uid, email });
          const sessionUser = await dbUser(data.publicKey);
          return {
            ...sessionUser,
            walletType: cred.walletType,
            email: email,
            emailVerified: true,
          };
        }

        if (cred.walletType == WalletType.apple) {
          const { appleToken, appleUid, token, email } = cred;

          if (appleUid && token) {
            const data = await getUserPublicKeyWithAppleUid({ appleUid });
            const sessionUser = await dbUser(data.publicKey);
            return {
              ...sessionUser,
              walletType: cred.walletType,
              emailVerified: true,
              email: email,
            };
          } else {
            if (appleToken) {
              const appleUid = await appleTokenToUserProvideUid(appleToken);

              const data = await getUserPublicKeyWithAppleUid({ appleUid });
              const sessionUser = await dbUser(data.publicKey);
              return {
                ...sessionUser,
                walletType: cred.walletType,
                emailVerified: true,
              };
            }
          }
        }

        return null;
      },
    }),
  ],
};

/**
 * Wrapper for `getServerSession` so that you don't need to import the `authOptions` in every file.
 *
 * @see https://next-auth.js.org/configuration/nextjs
 */
export const getServerAuthSession = (ctx: {
  req: GetServerSidePropsContext["req"];
  res: GetServerSidePropsContext["res"];
}) => {
  return getServerSession(ctx.req, ctx.res, authOptions);
};

async function dbUser(pubkey: string) {
  const user = await db.user.findUnique({ where: { id: pubkey } });
  // if user is not created create user.
  if (user) {
    return user;
  } else {
    const data = await db.user.create({
      data: { id: pubkey, name: truncateString(pubkey) },
    });
    return data;
  }
}

async function getUserPublicKey({
  uid,
  email,
}: {
  uid: string;
  email: string;
}) {
  const res = await axios.get<z.infer<typeof getPublicKeyAPISchema>>(
    USER_ACCOUNT_URL,
    {
      params: {
        uid,
        email,
      },
    },
  );
  return res.data;
}

export async function getUserPublicKeyWithAppleUid({
  appleUid,
}: {
  appleUid: string;
}) {
  const res = await axios.get<z.infer<typeof getPublicKeyAPISchema>>(
    USER_ACCOUNT_URL_APPLE,
    {
      params: {
        appleUid,
      },
    },
  );
  return res.data;
}
