import { deleteCookie, setCookie } from "cookies-next";
import { create } from "zustand";
import { devtools, persist, subscribeWithSelector } from "zustand/middleware";
import { WalletType } from "../enums";

export interface ConnectWalletStateModel {
  walletType: WalletType;
  isAva: boolean;
  uid?: string;
  email?: string;
  pubkey: string;
  removeUserDat: () => void;
  setUserData: (
    pubkey: string,
    isAva: boolean,
    walletType: WalletType,
    uid?: string,
    email?: string,
  ) => void;
}

export const useConnectWalletStateStore = create(
  subscribeWithSelector(
    devtools(
      persist<ConnectWalletStateModel>(
        (set) => ({
          walletType: WalletType.none,
          isAva: false,
          pubkey: "",
          removeUserDat: () => {
            deleteCookie("pubkey", { sameSite: true });
            return set({
              pubkey: "",
              isAva: false,
              walletType: WalletType.none,
            });
          },
          setUserData: function (pubkey, isAva, walletType, uid, email) {
            setCookie("pubkey", pubkey, {
              sameSite: true,
            });
            return set({
              pubkey: pubkey,
              isAva: isAva,
              walletType: walletType,
              uid: uid,
              email: email,
            });
          },
        }),
        {
          name: "wallet-storage-state",
        },
      ),
    ),
  ),
);
