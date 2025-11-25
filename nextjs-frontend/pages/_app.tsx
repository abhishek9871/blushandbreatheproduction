import "@/styles/globals.css";
import type { AppProps } from "next/app";
import Head from "next/head";
import { ThemeProvider } from "@/hooks/useTheme";
import { BookmarkProvider } from "@/hooks/useBookmarks";
import { UserProfileProvider } from "@/hooks/useUserProfile";
import { NutritionCartProvider } from "@/hooks/useNutritionCart";
import Layout from "@/components/Layout";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Lexend:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
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
    </>
  );
}
