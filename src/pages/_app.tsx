import { type Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import { type AppType } from "next/app";

import { api } from "~/utils/api";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import { Titillium_Web } from "next/font/google";
import "~/styles/globals.css";
import Layout from "~/components/layout";

const queryClient = new QueryClient();

const PopupImports = dynamic(
  () => import("package/connect_wallet/src/components/popup_imports"),
);

const inner = Titillium_Web({ subsets: ["latin"], weight: "400" });

const MyApp: AppType<{ session: Session | null }> = ({
  Component,
  pageProps: { session, ...pageProps },
}) => {
  return (
    <SessionProvider session={session}>
      <QueryClientProvider client={queryClient}>
        <Layout>
          <Component {...pageProps} />
          <PopupImports className={inner.className} />
        </Layout>
      </QueryClientProvider>
    </SessionProvider>
  );
};

export default api.withTRPC(MyApp);
