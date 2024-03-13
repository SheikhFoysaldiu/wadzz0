import {
  BASE_FEE,
  Keypair,
  Operation,
  Server,
  Networks,
  TransactionBuilder,
  Asset,
} from "stellar-sdk";
import { env } from "~/env";
import { DEFAULT_ASSET_LIMIT, STELLAR_URL, STORAGE_PUB } from "../constant";
import { SignUserType, WithSing } from "../../utils";
import { AccountType } from "../../fan/utils";

const log = console;

// transection variables

export const networkPassphrase = env.NEXT_PUBLIC_STELLAR_PUBNET
  ? Networks.PUBLIC
  : Networks.TESTNET;

export type trxResponse = {
  successful: boolean;
  issuerAcc: { pub: string; secret: string };
  distributorSecret: string;
  ipfsHash: string;
  error?: { status: number; msg: string };
};

export async function firstTransection({
  assetCode,
  limit,
  ipfsHash,
  signWith,
}: {
  assetCode: string;
  limit: string; // full number
  ipfsHash: string;
  signWith: SignUserType;
}) {
  const server = new Server(STELLAR_URL);
  // mother acc

  const motherAcc = Keypair.fromSecret(env.MOTHER_SECRET);

  const storageAcc = Keypair.fromSecret(env.STORAGE_SECRET);

  // Create two new Acc
  // issuer
  const issuerAcc = Keypair.random();
  // distributor
  // const distributorAcc = Keypair.random();

  const musicAsset = new Asset(assetCode, issuerAcc.publicKey());

  const transactionInializer = await server.loadAccount(motherAcc.publicKey());
  // for (const balance of transactionInializer.balances) {
  //   if (balance.asset_type === "native") {
  //     if (Number(balance.balance) < 5) {
  //       throw new Error("You don't have sufficient balance");
  //     }
  //     log.info(`XLM Balance for ${balance.balance}`);
  //     break;
  //   }
  // }

  const Tx1 = new TransactionBuilder(transactionInializer, {
    fee: "200",
    networkPassphrase,
  })

    // 0
    .addOperation(
      Operation.createAccount({
        destination: issuerAcc.publicKey(),
        startingBalance: "1.5",
        source: motherAcc.publicKey(),
      }),
    )
    // //
    // .addOperation(
    //   Operation.createAccount({
    //     destination: distributorAcc.publicKey(),
    //     startingBalance: "1.5",
    //     source: motherAcc.publicKey(),
    //   }),
    // )
    // //
    // .addOperation(
    //   Operation.changeTrust({
    //     asset: musicAsset,
    //     limit: limit,
    //     source: distributorAcc.publicKey(),
    //   }),
    // )
    // //
    // .addOperation(
    //   Operation.payment({
    //     asset: musicAsset,
    //     amount: limit,
    //     source: issuerAcc.publicKey(),
    //     destination: distributorAcc.publicKey(),
    //   }),
    // )
    //
    //
    .addOperation(
      Operation.changeTrust({
        asset: musicAsset,
        source: storageAcc.publicKey(),
      }),
    )
    //
    .addOperation(
      Operation.payment({
        destination: storageAcc.publicKey(),
        amount: limit,
        source: issuerAcc.publicKey(),
        asset: musicAsset,
      }),
    )

    .addOperation(
      Operation.manageData({
        name: "ipfshash",
        value: ipfsHash,
        source: issuerAcc.publicKey(),
      }),
    )
    //
    .addOperation(
      Operation.setOptions({
        homeDomain: "music.bandcoin.io",
        source: issuerAcc.publicKey(),
      }),
    )

    .setTimeout(0)
    .build();

  Tx1.sign(motherAcc, issuerAcc, storageAcc);
  const xdr = Tx1.toXDR();
  // const signedXDr = await WithSing({ xdr, signWith }); // bcz admin only create song

  const issuer: AccountType = {
    publicKey: issuerAcc.publicKey(),
    secretKey: issuerAcc.secret(),
  };
  return { xdr, issuer };
}

export const getBalncesOfStorag = async () => {
  try {
    const server = new Server(STELLAR_URL);
    const account = await server.loadAccount(STORAGE_PUB);
    return account.balances;
  } catch (e) {
    log.info(e);
  }
};

export type BalanceType = {
  asset: string;
  balance: string;
};
export const getAccBalance = async (accPub: string) => {
  const server = new Server(STELLAR_URL);
  const account = await server.loadAccount(accPub);
  const balances: BalanceType[] = [];

  for (const balance of account.balances) {
    if (
      balance.asset_type == "credit_alphanum12" ||
      balance.asset_type == "credit_alphanum4"
    ) {
      const item: BalanceType = {
        asset: `${balance.asset_code}-${balance.asset_issuer}`,
        balance: balance.balance,
      };
      balances.push(item);
    }
  }

  return balances;
};

export const checkAssetBalance = async ({
  storagePub,
  assset,
}: {
  storagePub: string;
  assset: { code: string; issuer: string };
}) => {
  const server = new Server(STELLAR_URL);
  const account = await server.loadAccount(storagePub);

  for (const balance of account.balances) {
    if (
      balance.asset_type === "credit_alphanum4" ||
      balance.asset_type === "credit_alphanum12"
    ) {
      // log.info(balance.asset_code);
      if (
        balance.asset_code == assset.code &&
        balance.asset_issuer == assset.issuer
      ) {
        return balance.balance;
      }
    }
  }
};
