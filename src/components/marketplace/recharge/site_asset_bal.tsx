import { useSession } from "next-auth/react";
import Link from "next/link";
import { WalletType } from "package/connect_wallet/src/lib/enums";
import { useUserStellarAcc } from "~/lib/state/wallete/stellar-balances";
import { PLATFROM_ASSET } from "~/lib/stellar/fan/constant";
import { api } from "~/utils/api";

export function SiteAssetBalance() {
  const { setBalance, setActive, active } = useUserStellarAcc();
  const session = useSession();

  const bal = api.wallate.acc.getAccountBalance.useQuery(undefined, {
    onSuccess: (data) => {
      const { balances, platformAssetBal, xlm } = data;
      setBalance(balances);
      setActive(true);
    },
    onError: (error) => {
      // toast.error(error.message);
      setActive(false);
    },
  });

  const walletType = session.data?.user.walletType ?? WalletType.none;

  const isFBorGoogle =
    walletType == WalletType.facebook ||
    walletType == WalletType.google ||
    walletType == WalletType.emailPass ||
    walletType == WalletType.apple;

  if (walletType == WalletType.none) return null;
  if (bal.isLoading) return <div className="skeleton h-10 w-48"></div>;
  // if (!bal.isSuccess)
  //   return (
  //     <div className="flex h-10 w-48 items-center justify-center rounded-2xl bg-error text-white">
  //       Pubkey Not Active
  //     </div>
  //   );
  return (
    <Link
      className="btn  border-0 "
      href={isFBorGoogle ? "/recharge" : "/"}
      // href="/recharge"
    >
      <div className="flex flex-col">
        <p className="flex flex-row text-xs md:text-sm">
          <span className="hidden md:flex">{PLATFROM_ASSET.code} :</span>{" "}
          {bal.data?.platformAssetBal}
        </p>
      </div>
    </Link>
  );
}

function formatNumber(input?: string): string | null {
  if (input) {
    const parsedNumber = parseFloat(input);

    if (!isNaN(parsedNumber) && Number.isInteger(parsedNumber)) {
      if (Math.abs(parsedNumber) >= 1e6) {
        // If the parsed number is an integer larger than or equal to 1 million,
        // format it in scientific notation
        return parsedNumber.toExponential();
      } else {
        // If the parsed number is an integer smaller than 1 million,
        // return it as is
        return String(parsedNumber);
      }
    } else if (!isNaN(parsedNumber)) {
      // If the parsed number is a float, limit it to two decimal places
      return parsedNumber.toFixed(2);
    } else {
      // If the input is not a valid number, return null or handle accordingly
      return null;
    }
  }
  return null;
}
