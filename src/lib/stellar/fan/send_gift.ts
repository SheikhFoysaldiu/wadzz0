import {
  Keypair,
  Operation,
  Server,
  TransactionBuilder,
  Asset,
} from "stellar-sdk";
import {
  PLATFROM_ASSET,
  PLATFROM_FEE,
  STELLAR_URL,
  networkPassphrase,
} from "./constant";
import { env } from "~/env";
import { MyAssetType } from "./utils";
import { STROOP } from "../marketplace/constant";

const log = console;

export async function sendGift({
  customerPubkey,
  creatorPageAsset,
  creatorPub,
  price,
  creatorStorageSec,
}: {
  customerPubkey: string;
  creatorPageAsset: MyAssetType;
  price: string;
  creatorPub: string;
  creatorStorageSec: string;
}) {
  const server = new Server(STELLAR_URL);
  const asset = new Asset(creatorPageAsset.code, creatorPageAsset.issuer);

  const assetStorage = Keypair.fromSecret(creatorStorageSec);
  const maotherAcc = Keypair.fromSecret(env.MOTHER_SECRET);

  const transactionInializer = await server.loadAccount(maotherAcc.publicKey());

  const Tx1 = new TransactionBuilder(transactionInializer, {
    fee: "200",
    networkPassphrase,
  })

    // // change trust
    // .addOperation(
    //   Operation.changeTrust({
    //     asset,
    //   }),
    // )

    // get payment
    .addOperation(
      Operation.payment({
        asset,
        amount: price,
        source: assetStorage.publicKey(),
        destination: customerPubkey,
      }),
    )
    // pay the creator the price amount
    // .addOperation(
    //   Operation.payment({
    //     amount: price,
    //     asset: PLATFROM_ASSET,
    //     destination: creatorPub,
    //   }),
    // )
    // sending platform fee.
    // .addOperation(
    //   Operation.payment({
    //     amount: PLATFROM_FEE,
    //     asset: PLATFROM_ASSET,
    //     destination: maotherAcc.publicKey(),
    //   }),
    // )

    .setTimeout(0)
    .build();

  Tx1.sign(assetStorage, maotherAcc);
  return Tx1.toXDR();
}
