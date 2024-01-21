import React from "react";

import * as z from "zod";
import { api } from "~/utils/api";
import { useSession } from "next-auth/react";
import { type Session } from "next-auth";
import Tabs from "~/components/creator/tabs";
import { CreatorMenu, useCreator } from "~/lib/state/creator-menu";
import { PostMenu } from "~/components/creator/CreatPost";
import MemberShip from "~/components/creator/membership";
import About from "~/components/creator/about";
import Avater from "~/components/ui/avater";
import { Creator } from "@prisma/client";

export default function CreatorProfile() {
  const { data: session } = useSession();

  if (!session) return <div>LogIn First</div>;

  return <CreatorExist user={session.user} />;
}

function CreatorExist(props: { user: Session["user"] }) {
  const { data: creator, isLoading } = api.creator.getCreator.useQuery({
    id: props.user.id,
  });

  if (isLoading) return <div>Checking..</div>;
  if (creator) {
    return <CreatorPageTemplate creator={creator} />;
  } else {
    return <CreateCreator id={props.user.id} />;
  }
}

function CreatorPageTemplate(props: { creator: Creator }) {
  return (
    <div className="flex flex-1 flex-col items-center">
      <div className="h-40 w-full bg-base-300"></div>
      <div className="mb-10 flex flex-col items-center justify-center gap-4">
        <div className="-mt-16 flex h-36 w-36 items-center justify-center rounded-full bg-white">
          {/* <div className="h-28 w-28 rounded-full bg-red-400"></div> */}
          <Avater className="w-28" />
        </div>
        <div className="flex flex-col items-center">
          <h1 className="text-2xl font-bold">{props.creator.name}</h1>
          <p>{props.creator.bio}</p>
        </div>
      </div>
      <div className=" mb-6 w-3/4 bg-base-300">
        <Tabs />
      </div>
      <ConditionallyRenderMenuPage id={props.creator.id} />
    </div>
  );
}

function ConditionallyRenderMenuPage(props: { id: string }) {
  const { selectedMenu } = useCreator();
  switch (selectedMenu) {
    case CreatorMenu.Posts:
      return <PostMenu id={props.id} />;
    case CreatorMenu.Membership:
      return <MemberShip />;
    case CreatorMenu.About:
      return <About id={props.id} />;
  }
}

function CreateCreator(props: { id: string }) {
  const makeCreatorMutation = api.creator.makeMeCreator.useMutation();

  return (
    <div>
      <p>You are not a creator</p>
      <button onClick={() => makeCreatorMutation.mutate({ id: props.id })}>
        Be a creator
      </button>
    </div>
  );
}
