import { zodResolver } from "@hookform/resolvers/zod";
import React from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { z } from "zod";
import Avater from "../ui/avater";
import { Creator } from "@prisma/client";
import { api } from "~/utils/api";
import { UploadButton } from "~/utils/uploadthing";

export default function About({ creator }: { creator: Creator }) {
  return (
    <div className="flex flex-col items-center">
      <h2 className="text-2xl font-bold">About</h2>
      <div className="my-5 bg-base-200">
        <AboutForm creator={creator} />
      </div>
    </div>
  );
}

export const CreatorAboutShema = z.object({
  id: z.string(),
  description: z.string().nullable(),
  name: z.string().min(3, { message: "Required" }),
  profileUrl: z.string().nullable().optional(),
});

function AboutForm({ creator }: { creator: Creator }) {
  const mutation = api.creator.updateCreatorProfile.useMutation();
  const updateProfileMutation =
    api.creator.changeCreatorProfilePicture.useMutation();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<typeof CreatorAboutShema>>({
    resolver: zodResolver(CreatorAboutShema),
    defaultValues: {
      id: creator.id,
      name: creator.name,
      description: creator.bio,
    },
  });

  const onSubmit: SubmitHandler<z.infer<typeof CreatorAboutShema>> = (data) =>
    mutation.mutate(data);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-2 p-5">
      <div className="flex items-center justify-center gap-2">
        <div className="">
          <Avater url={creator.profileUrl} />
        </div>
        <UploadButton
          endpoint="imageUploader"
          appearance={{
            allowedContent(arg) {
              return { display: "none" };
            },
          }}
          content={{ button: "Change Photo" }}
          onClientUploadComplete={(res) => {
            // Do something with the response
            console.log("Files: ", res);
            // alert("Upload Completed");
            const data = res[0];

            if (data?.url) {
              updateProfileMutation.mutate(data.url);
            }
            // updateProfileMutation.mutate(res);
          }}
          onUploadError={(error: Error) => {
            // Do something with the error.
            alert(`ERROR! ${error.message}`);
          }}
        />
      </div>
      <label className="form-control w-full max-w-xs">
        <div className="label">
          <span className="label-text">Display Name</span>
        </div>
        <input
          type="text"
          placeholder="Enter Name ..."
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
      <label className="form-control">
        <div className="label">
          <span className="label-text">Your bio</span>
        </div>
        <textarea
          {...register("description")}
          className="textarea textarea-bordered h-24"
          placeholder="Description ..."
        ></textarea>
        {errors.description && (
          <div className="label">
            <span className="label-text-alt text-warning">
              {errors.description.message}
            </span>
          </div>
        )}
      </label>
      <button className="btn btn-primary" type="submit">
        {mutation.isLoading && (
          <span className="loading loading-spinner"></span>
        )}
        Save
      </button>
    </form>
  );
}
