import Image from "next/image";
import Link from "next/link";
import React, { useState } from "react";
import { Separator } from "~/components/shadcn/ui/separator";
import { api } from "~/utils/api";
import { formatPostCreatedAt } from "~/utils/format-date";
import { getNotificationMessage } from "~/utils/notificationConfig";

export default function CreatorNotofication() {
  return (
    // <div className="flex flex-col items-center gap-4 p-5 ">
    //   <h2 className="text-2xl font-bold">Notifications</h2>
    //   <div className="bg-base-200 p-4">
    //     {notifications.data?.pages.map((page) => {
    //       return page.items.map((el) => {
    //         const { message, url } = getNotificationMessage(
    //           el.notificationObject,
    //         );
    //         return (
    //           <div key={el.id} className="flex flex-col hover:bg-neutral">
    //             <Link
    //               href={url}
    //               className="p-4 hover:bg-base-100 hover:underline"
    //             >
    //               {message} {formatPostCreatedAt(el.createdAt)}
    //             </Link>
    //           </div>
    //         );
    //       });
    //     })}

    //     {notifications.hasNextPage && (
    //       <button
    //         className="btn"
    //         onClick={() => void notifications.fetchNextPage()}
    //       >
    //         Load More
    //       </button>
    //     )}
    //   </div>
    // </div>
    <div className="h-full bg-base-200">
      <div className="flex  h-full flex-row items-start justify-center">
        <Notifications />
      </div>
    </div>
  );
}
const Notifications = () => {
  const [newNotifications, setNewNotifications] = useState([0, 1, 2]);

  function newNotificationCount() {
    return newNotifications.length;
  }

  function isNew(id: number) {
    return newNotifications.includes(id);
  }

  function markAllAsRead() {
    setNewNotifications([]);
  }

  function addNewNotification(id: number) {
    setNewNotifications([...newNotifications, id]);
  }

  function toggleNotification(id: number) {
    if (newNotifications.includes(id)) {
      removeNewNotification(id);
    } else {
      addNewNotification(id);
    }
  }

  function removeNewNotification(id: number) {
    setNewNotifications(
      newNotifications.filter((notification) => notification !== id),
    );
  }
  const notifications =
    api.fan.notification.getCreatorNotifications.useInfiniteQuery(
      { limit: 10 },
      { getNextPageParam: (lastPage) => lastPage.nextCursor },
    );
  return (
    <div className=" w-full rounded-lg bg-white shadow-sm lg:w-[715px]">
      <div className="p-6">
        <div className="mb-6 flex flex-row gap-x-6">
          <h1 className="text-2xl font-bold">Creator{"'s"} Notifications</h1>
          {/* <a className="my-auto rounded-lg bg-[#0a3279] px-3 font-bold text-white">
            {newNotificationCount()}
          </a> */}
        </div>

        {/* Mark Webber */}
        {notifications.data?.pages.map((page) => {
          return page.items.map((el) => {
            const { message, url } = getNotificationMessage(
              el.notificationObject,
            );
            return (
              // <div key={el.id} className="flex flex-col hover:bg-neutral">
              //   <Link
              //     href={url}
              //     className="p-4 hover:bg-base-100 hover:underline"
              //   >
              //     {message} {formatPostCreatedAt(el.createdAt)}
              //   </Link>
              // </div>
              <>
                <div key={el.id} className="flex flex-col gap-x-3 gap-y-2 p-2">
                  <Link href={url}>
                    <Image
                      width={30}
                      height={30}
                      className="person-icon"
                      src={"/images/icons/avatar-icon.png"}
                      alt="user icon"
                    />
                    <div className="ml-4 w-full">
                      <a>
                        <span className="message-describe ml-2">{message}</span>
                      </a>
                      <div className="">
                        <p className="message-duration">
                          {formatPostCreatedAt(el.createdAt)}
                        </p>
                      </div>
                    </div>
                  </Link>
                </div>

                <Separator />
              </>
            );
          });
        })}

        {notifications.hasNextPage && (
          <button
            className="btn"
            onClick={() => void notifications.fetchNextPage()}
          >
            Load More
          </button>
        )}
      </div>
    </div>
  );
};
