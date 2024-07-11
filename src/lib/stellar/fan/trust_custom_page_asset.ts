import {
  Asset,
  Horizon,
  Keypair,
  Operation,
  TransactionBuilder,
} from "@stellar/stellar-sdk";
import { env } from "~/env";
import { SignUserType, WithSing } from "../utils";
import { PLATFROM_ASSET, STELLAR_URL, networkPassphrase } from "../constant";

export async function trustCustomPageAsset({
  creator,
  code,
  issuer,
  storageSecret,
  requiredPlatformAsset,
  signWith,
}: {
  creator: string;
  requiredPlatformAsset: string;
  code: string;
  issuer: string;
  storageSecret: string;
  signWith: SignUserType;
}) {
  const server = new Horizon.Server(STELLAR_URL);

  const asset = new Asset(code, issuer);

  // const motherAccount = Keypair.fromSecret(env.MOTHER_SECRET);
  const motherAcc = Keypair.fromSecret(env.MOTHER_SECRET);
  const creatorStorageAcc = Keypair.fromSecret(storageSecret);

  const transactionInializer = await server.loadAccount(creator);

  const Tx1 = new TransactionBuilder(transactionInializer, {
    fee: "200",
    networkPassphrase,
  });

  Tx1.addOperation(
    Operation.payment({
      amount: requiredPlatformAsset,
      destination: motherAcc.publicKey(),
      asset: PLATFROM_ASSET,
    }),
  )
    .addOperation(
      Operation.payment({
        amount: "0.5",
        asset: Asset.native(),
        destination: creatorStorageAcc.publicKey(),
        source: motherAcc.publicKey(),
      }),
    )
    .addOperation(
      Operation.changeTrust({
        asset,
        source: creatorStorageAcc.publicKey(),
      }),
    )
    .setTimeout(0);

  const buildTrx = Tx1.build();
  buildTrx.sign(creatorStorageAcc, motherAcc);

  const xdr = buildTrx.toXDR();

  const signedXDr = await WithSing({
    xdr: xdr,
    signWith: signWith,
  });

  return signedXDr;
}
