import type React from "react";
import type { Metadata } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import ProviderWrapper from "@/components/provider-wrapper";
import { ToastContainer } from "react-toastify";
import { NuqsAdapter } from "@/lib/nuqs-adapter";

import "react-toastify/dist/ReactToastify.css";
import "./globals.css";

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-be-vietnam-pro",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Hệ thống Quản lý Tài liệu",
  description: "Hệ thống quản lý tài liệu tĩnh hiện đại",
  generator: "v0.app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body
        className={`${beVietnamPro.variable} font-sans antialiased`}
      >
        <ToastContainer
          position="top-right"
          autoClose={2500}
          hideProgressBar
          theme="colored"
        />
        <NuqsAdapter>
          <ProviderWrapper>{children}</ProviderWrapper>
        </NuqsAdapter>
      </body>
    </html>
  );
}
