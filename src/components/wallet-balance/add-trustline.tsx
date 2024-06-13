"use client";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Input } from "~/components/shadcn/ui/input";
import { clientSelect } from "~/lib/stellar/fan/utils";

import {
  Form,
  FormField,
  FormItem,
  FormControl,
  FormLabel,
  FormMessage,
} from "~/components/shadcn/ui/form";
import { Button } from "../shadcn/ui/button";
import { Label } from "../shadcn/ui/label";
import { Plus, ShieldPlus } from "lucide-react";
import { api } from "~/utils/api";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import { clientsign } from "package/connect_wallet";
import { useState } from "react";
import useNeedSign from "~/lib/hook";

const formSchema = z.object({
  asset_code: z.string().min(1, {
    message: "Asset code Id is required.",
  }),
  // limit: z.number().positive({
  //   message: "Limit must be greater than zero.",
  // }),
  issuerId: z.string().min(1, {
    message: "IssuerId code is required.",
  }),
});

const AddTrustLine = () => {
  const session = useSession();
  const [loading, setLoading] = useState(false);
  const { needSign } = useNeedSign();
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      asset_code: "",
      issuerId: "",
    },
  });

  const AddTrustMutation =
    api.walletBalance.wallBalance.addTrustLine.useMutation({
      onSuccess(data) {
        clientsign({
          walletType: session?.data?.user?.walletType,
          presignedxdr: data.xdr,
          pubkey: data.pubKey,
          test: clientSelect(),
        })
          .then((data) => {
            if (data) {
              setLoading(false);
              toast.success("TrustLine Added successful");
              handleClose();
            } else {
              setLoading(false);
              toast.error("Adding TrustLine Operation is failed");
            }
          })
          .catch(() => {
            setLoading(false);
            toast.error("Adding TrustLine Operation is failed");
          });
      },

      onError(error) {
        setLoading(false);
        toast.error(error.message);
      },
    });

  const handleClose = () => {
    form.reset();
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (values.asset_code.toUpperCase() === "XLM") {
      return toast.error("Asset Code can't be XLM");
    } else {
      if (values) {
        setLoading(true);
        AddTrustMutation.mutate({
          asset_code: values.asset_code,
          asset_issuer: values.issuerId,
          signWith: needSign(),
        });
      } else {
        toast.error("Please fill up the form correctly.");
      }
    }
  };

  return (
    <div className="flex flex-col space-x-2">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="space-y-2 px-2">
            <FormField
              control={form.control}
              name="asset_code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold uppercase">
                    Asset Code
                  </FormLabel>
                  <FormControl>
                    <Input
                      disabled={loading}
                      className="focus-visible:ring-0 focus-visible:ring-offset-0"
                      placeholder="Enter Recipient ID..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="issuerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold uppercase">
                    Issuer ID
                  </FormLabel>
                  <FormControl>
                    <Input
                      disabled={loading}
                      type="text"
                      className="focus-visible:ring-0 focus-visible:ring-offset-0"
                      placeholder="Enter Issuer ID..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex items-center justify-end space-y-6">
              <Button
                type="submit"
                disabled={loading}
                variant="default"
                className="shrink-0 font-bold "
              >
                <Plus className="mr-2  font-bold" size={20} />
                ADD
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default AddTrustLine;
