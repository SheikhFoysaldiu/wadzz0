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
  LOWEST_ASSET_AMOUNT,
  networkPassphrase,
} from "./constant";
import { AccountType } from "./utils";
import { SignUserType, WithSing } from "../utils";

const log = console;

export async function createStorageTrx({
  pubkey,
  signWith,
}: {
  pubkey: string;
  signWith: SignUserType;
}) {
  const server = new Server(STELLAR_URL);

  const storageAcc = Keypair.random();

  const transactionInializer = await server.loadAccount(pubkey);

  const Tx1 = new TransactionBuilder(transactionInializer, {
    fee: "200",
    networkPassphrase,
  })

    // get payment
    .addOperation(
      Operation.createAccount({
        destination: storageAcc.publicKey(),
        startingBalance: "1.5",
      }),
    )
    // pay the creator the price amount

    .setTimeout(0)
    .build();

  const storage: AccountType = {
    publicKey: storageAcc.publicKey(),
    secretKey: storageAcc.secret(),
  };

  const xdr = await WithSing({ xdr: Tx1.toXDR(), signWith });

  return { xdr, storage };
}
