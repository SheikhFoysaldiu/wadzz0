import clsx from "clsx";
import React from "react";
import { CreatPost, PostList } from "~/components/creator/CreatPost";
import { CreateMenu, useCreateMenu } from "~/lib/state/create-menu";
import { api } from "~/utils/api";

export default function CreatorsPost() {
  return (
    <div className="h-screen p-5">
      <h2 className="text-center text-3xl font-bold">Contents</h2>

      <div className="flex flex-col items-center justify-center">
        <CreateTabs />
        <div className="mt-10 flex max-w-sm">
          <RenderTabs />
        </div>
      </div>
    </div>
  );
}

function RenderTabs() {
  const { setSelectedMenu, selectedMenu } = useCreateMenu();
  switch (selectedMenu) {
    case CreateMenu.Home:
      return <CreatPost />;
    case CreateMenu.Posts:
      return <Posts />;
  }
}

function Posts() {
  const creator = api.creator.meCreator.useQuery();
  if (creator.data) {
    return <PostList id={creator.data.id} />;
  }
}

function CreateTabs() {
  const { setSelectedMenu, selectedMenu } = useCreateMenu();
  return (
    <div role="tablist" className="tabs tabs-bordered">
      {Object.values(CreateMenu).map((key) => {
        return (
          <a
            key={key}
            onClick={() => setSelectedMenu(key)}
            role="tab"
            className={clsx("tab", selectedMenu == key && "tab-active")}
          >
            {key}
          </a>
        );
      })}
    </div>
  );
}