import React, { useState } from "react";
import { useForm, SubmitHandler, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { api } from "~/utils/api";
import toast from "react-hot-toast";
import { MediaType, Post } from "@prisma/client";
import { formatPostCreatedAt } from "~/utils/format-date";
import {
  Heart,
  Image as ImageIcon,
  Lock,
  MessageCircle,
  Share2,
  Video,
} from "lucide-react";
import Link from "next/link";
import clsx from "clsx";
import { UploadButton } from "~/utils/uploadthing";
import Image from "next/image";
import { PostCard } from "./post";

export const PostSchema = z.object({
  id: z.string(),
  heading: z.string().min(1, { message: "Required" }),
  content: z.string().min(20, { message: "Minimum 20 is reguired" }),
  subscription: z.string().optional(),
  mediaType: z.nativeEnum(MediaType).nullable().optional(),
  mediaUrl: z.string().nullable().optional(),
});

export function CreatPost(props: { id: string }) {
  const utils = api.useUtils();

  const [medialUrl, setMediaUrl] = useState<string>();

  const createPostMutation = api.post.create.useMutation({
    onSuccess: () => {
      reset();
      toast.success("Post Created");
    },
  });
  const { data, isLoading } = api.member.getAllMembership.useQuery();

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,

    formState: { errors },
  } = useForm<z.infer<typeof PostSchema>>({
    resolver: zodResolver(PostSchema),
    defaultValues: { id: props.id },
  });

  console.log(errors);

  const onSubmit: SubmitHandler<z.infer<typeof PostSchema>> = (data) => {
    console.log(data, "data");
    createPostMutation.mutate(data);
  };

  if (isLoading) return <div>Loading... while getting subscription</div>;
  if (data)
    return (
      <div>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="my-10 flex min-w-96 flex-col gap-2 bg-base-200 p-5"
        >
          <label className="form-control w-full max-w-xs">
            <div className="label">
              <span className="label-text">Heading</span>
            </div>
            <input
              type="text"
              placeholder="Heading of the post"
              {...register("heading")}
              className="input input-bordered w-full max-w-xs"
            />
            {errors.heading && (
              <div className="label">
                <span className="label-text-alt text-warning">
                  {errors.heading.message}
                </span>
              </div>
            )}
          </label>

          <label className="form-control">
            <div className="label">
              <span className="label-text">Write Details</span>
            </div>
            <textarea
              {...register("content")}
              className="textarea textarea-bordered h-24"
              placeholder="Description ..."
            ></textarea>
            {errors.content && (
              <div className="label">
                <span className="label-text-alt text-warning">
                  {errors.content.message}
                </span>
              </div>
            )}
          </label>

          <Controller
            name="subscription"
            control={control}
            render={({ field }) => (
              <select
                {...field}
                className="select select-bordered w-full max-w-xs"
              >
                <option selected disabled>
                  Select an subscription model
                </option>
                {data.map((model) => (
                  <option
                    key={model.id}
                    value={model.id}
                  >{`${model.name} ${model.priority}`}</option>
                ))}
              </select>
            )}
          />
          <div>
            <div className="flex h-40 flex-col items-center justify-center gap-2">
              {medialUrl && (
                <Image src={medialUrl} alt="d" height={100} width={100} />
              )}
              <UploadButton
                endpoint="imageUploader"
                content={{ button: "Change Photo" }}
                onClientUploadComplete={(res) => {
                  // Do something with the response
                  console.log("Files: ", res);
                  // alert("Upload Completed");
                  const data = res[0];

                  if (data?.url) {
                    setMediaUrl(data.url);
                    setValue("mediaType", MediaType.IMAGE);
                    setValue("mediaUrl", data.url);
                    // updateProfileMutation.mutate(data.url);
                  }
                  // updateProfileMutation.mutate(res);
                }}
                onUploadError={(error: Error) => {
                  // Do something with the error.
                  alert(`ERROR! ${error.message}`);
                }}
              />
            </div>
            <div className="bg-base-300">
              <div className="flex gap-2">
                <ImageIcon />
                <Video />
              </div>
            </div>
          </div>

          <button
            className="btn btn-primary"
            type="submit"
            disabled={createPostMutation.isLoading}
          >
            {createPostMutation.isLoading && (
              <span className="loading loading-spinner"></span>
            )}
            Create Post{" "}
          </button>
        </form>
      </div>
    );
}
export function PostList(props: { id: string }) {
  const { data, isLoading } = api.post.getPosts.useQuery({
    pubkey: props.id,
  });

  if (isLoading) return <div>Loading...</div>;
  if (data) {
    return (
      <div className="flex flex-col gap-2">
        {data.map((post) => (
          <PostCard
            creator={post.creator}
            key={post.id}
            post={post}
            like={post._count.Like}
            show
          />
        ))}
      </div>
    );
  }
}

export function PostMenu(props: { id: string }) {
  return (
    <div>
      <CreatPost id={props.id} />
      <PostList id={props.id} />
    </div>
  );
}
