import "@/styles/globals.css";
import type { AppProps } from "next/app";
import Head from "next/head";
import { ThemeProvider } from "@/hooks/useTheme";
import { BookmarkProvider } from "@/hooks/useBookmarks";
import { UserProfileProvider } from "@/hooks/useUserProfile";
import { NutritionCartProvider } from "@/hooks/useNutritionCart";
import Layout from "@/components/Layout";
import { SpeedInsights } from "@vercel/speed-insights/next";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {/* Fonts are preloaded in _document.tsx to prevent FOUT */}
      </Head>
      <ThemeProvider>
        <BookmarkProvider>
          <UserProfileProvider>
            <NutritionCartProvider>
              <Layout>
                <Component {...pageProps} />
              </Layout>
            </NutritionCartProvider>
          </UserProfileProvider>
        </BookmarkProvider>
      </ThemeProvider>
      <SpeedInsights />
    </>
  );
}
