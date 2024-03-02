import { clientsign, useConnectWalletStateStore } from "package/connect_wallet";
import React, { useRef, useState } from "react";
import toast from "react-hot-toast";
import { api } from "~/utils/api";
import { truncateString } from "~/utils/string";
import { PLATFROM_ASSET, PLATFROM_FEE } from "~/lib/stellar/fan/constant";
import { clientSelect } from "~/lib/stellar/fan/utils";
import { cn } from "~/lib/wallate/utils";
import { Asset } from "@prisma/client";

export default function BuyItemModal({
  item,
  btnClassName,
}: {
  item: Asset;
  btnClassName?: string;
}) {
  const modalRef = useRef<HTMLDialogElement>(null);
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  // get buy xdr

  const handleModal = () => {
    modalRef.current?.showModal();
    isModalOpen ? setIsModalOpen(false) : setIsModalOpen(true);
  };

  return (
    <>
      <button
        className={cn("btn btn-primary", btnClassName)}
        onClick={handleModal}
      >
        Buy Now
      </button>
      <dialog id="my_modal_1" className="modal" ref={modalRef}>
        <div className="modal-box">
          {isModalOpen && <ModalContent item={item} />}
          <div
            className="modal-action"
            onClick={() => modalRef.current?.close()}
          >
            <form method="dialog">
              <button className="btn" onClick={() => setIsModalOpen(false)}>
                Close
              </button>
            </form>
          </div>
        </div>
      </dialog>
    </>
  );
}

function ModalContent({ item }: { item: Asset }) {
  const { isAva, pubkey, walletType, uid, email } =
    useConnectWalletStateStore();
  const [trxMsg, setTrxMsg] = useState<string>();

  const xdr = api.fan.trx.buyAssetTrx.useMutation({
    onSuccess: (data) => {
      clientsign({
        presignedxdr: data,
        pubkey,
        walletType,
        test: clientSelect(),
      })
        .then((res) => {
          if (res) {
            toast.success("Transaction Success");
          }
        })
        .catch((e) => console.log(e));
    },
  });

  function handleSubmit() {
    if (item.creatorId)
      xdr.mutate({
        creatorId: item.creatorId,
        price: item.price,
        code: item.code,
        issuer: item.issuer,
      });
  }

  if (xdr.isLoading)
    return (
      <div className="flex items-center justify-center">
        <span className="loading loading-spinner mr-2" /> Getting XDR
      </div>
    );

  if (xdr.isError) return <p className="text-warning">{xdr.error.message}</p>;

  return (
    <div>
      <h3 className="text-center text-lg font-bold">Buy Asset</h3>
      <div className="flex flex-col items-center gap-1 rounded-lg bg-base-300 p-4">
        <div>
          <p>
            Name:
            <span className="badge">{item.code}</span>
          </p>
          {/* {xdr && <p>issuer: {truncateString(xdr.data, 10, 5)}</p>} */}
          <p>Issuer: {truncateString(item.issuer)}</p>
          <p>
            Price: {item.price} {PLATFROM_ASSET.code}
            <br />
            Platform Fee: {PLATFROM_FEE} {PLATFROM_ASSET.code}
          </p>

          {trxMsg && <p className="text-error">{trxMsg}</p>}

          {xdr && (
            <button
              className="btn btn-outline btn-primary  mt-4"
              onClick={handleSubmit}
            >
              Confirm
            </button>
          )}
        </div>
      </div>
    </div>
  );
}