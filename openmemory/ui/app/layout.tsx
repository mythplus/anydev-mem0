import type React from "react";
import "@/app/globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { Providers } from "./providers";
import { AppShell } from "@/components/AppShell";

export const metadata = {
  title: "OpenMemory - Developer Dashboard",
  description: "Manage your OpenMemory integration and stored memories",
  generator: "v0.dev",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="h-screen font-sans antialiased flex flex-col">
        <Providers>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange={false}
          >
            <AppShell>{children}</AppShell>
            <Toaster />
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  );
}
