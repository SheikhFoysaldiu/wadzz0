import { zodResolver } from "@hookform/resolvers/zod";
import { Creator } from "@prisma/client";
import React, { useRef } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { z } from "zod";
import { api } from "~/utils/api";
import { clientsign, useConnectWalletStateStore } from "package/connect_wallet";
import { AccounSchema } from "~/lib/stellar/utils";
import { Plus } from "lucide-react";

export const TierSchema = z.object({
  name: z
    .string()
    .min(4, { message: "Minimum 4 charecter" })
    .max(12, { message: "Maximum 12 charecter" })
    .refine(
      (value) => {
        // Check if the input is a single word
        return /^\w+$/.test(value);
      },
      {
        message: "Input must be a single word",
      },
    ),
  featureDescription: z
    .string()
    .min(20, { message: "Make description longer" }),
  day: z.number().min(1, { message: "Minimum 1 day" }),
});

export default function AddTierModal({ creator }: { creator: Creator }) {
  const modalRef = useRef<HTMLDialogElement>(null);
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  const { isAva, pubkey, walletType, uid, email } =
    useConnectWalletStateStore();
  const mutation = api.member.createMembership.useMutation({
    onSuccess: () => {
      reset();
    },
  });

  const trxMutation = api.trx.clawbackAssetCreationTrx.useMutation({
    onSuccess: async (data) => {
      if (data) {
        toast.success("xdr created!");
        clientsign({
          walletType,
          presignedxdr: data.trx,
          pubkey,
          test: true,
        })
          .then((res) => {
            if (res) {
              toast.success("popup success");
              mutation.mutate({
                name: getValues("name"),
                featureDescription:
                  getValues("featureDescription") || "No description",
                day: getValues("day"),
                escrow: data.escrow,
              });
            } else {
              toast.error("Error signing transaction");
            }
          })
          .catch((e) => console.log(e))
          .finally(() => {
            setIsModalOpen(false);
          });
      } else {
        toast.error("Error creating tier");
      }
      setIsModalOpen(false);
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
    reset,
  } = useForm<z.infer<typeof TierSchema>>({
    resolver: zodResolver(TierSchema),
    defaultValues: {},
  });

  const onSubmit: SubmitHandler<z.infer<typeof TierSchema>> = (data) => {
    setIsModalOpen(true);
    trxMutation.mutate({ code: getValues("name") });
    // mutation.mutate(data);
  };

  const handleModal = () => {
    modalRef.current?.showModal();
  };

  return (
    <>
      <button className="btn btn-outline btn-primary" onClick={handleModal}>
        <Plus />
        Add Tier
      </button>
      <dialog className="modal" ref={modalRef}>
        <div className="modal-box">
          <h3 className="mb-4 text-center text-lg font-bold">
            Create a subscription tier!
          </h3>
          <div className="w-full">
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="flex flex-col items-center  gap-2 rounded-md bg-base-300 py-8"
            >
              <label className="form-control w-full max-w-xs">
                <div className="label">
                  <span className="label-text">Tier Name</span>
                </div>
                <input
                  type="text"
                  placeholder="Name of the tier"
                  {...register("name")}
                  className="input input-bordered w-full max-w-xs"
                />
                {errors.name && (
                  <div className="label">
                    <span className="label-text-alt text-warning">
                      {errors.name.message}
                    </span>
                  </div>
                )}
              </label>
              <label className="form-control w-full max-w-xs">
                <div className="label">
                  <span className="label-text">Subscriptin Day</span>
                </div>
                <input
                  type="number"
                  placeholder="Subscription day"
                  min={1}
                  {...register("day", { valueAsNumber: true })}
                  className="input input-bordered w-full max-w-xs"
                />
                {errors.featureDescription && (
                  <div className="label">
                    <span className="label-text-alt text-warning">
                      {errors.featureDescription.message}
                    </span>
                  </div>
                )}
              </label>
              <label className="form-control w-full max-w-xs">
                <div className="label">
                  <span className="label-text">Tier Features</span>
                </div>
                <textarea
                  {...register("featureDescription")}
                  className="textarea textarea-bordered h-24"
                  placeholder="What does this tier offer?"
                ></textarea>
                {errors.featureDescription && (
                  <div className="label">
                    <span className="label-text-alt text-warning">
                      {errors.featureDescription.message}
                    </span>
                  </div>
                )}
              </label>
              <button
                className="btn btn-primary mt-2 w-full max-w-xs"
                type="submit"
                disabled={mutation.isLoading}
              >
                {(mutation.isLoading || isModalOpen) && (
                  <span className="loading loading-spinner"></span>
                )}
                Create Tier
              </button>
            </form>
          </div>
          <div className="modal-action">
            <form method="dialog">
              <button className="btn">Close</button>
            </form>
          </div>
        </div>
      </dialog>
    </>
  );
}
