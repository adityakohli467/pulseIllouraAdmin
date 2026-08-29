import type { Metadata } from "next"
import { Albert_Sans } from "next/font/google"
import "./globals.css"
import { Providers } from "@/components/providers"
import { DashboardLayout } from "./dashboard-layout"
import { ErrorHandler } from "@/components/ErrorHandler"
import { SessionManager } from "@/components/session-manager"

const albertSans = Albert_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-albert-sans",
})

export const metadata: Metadata = {
  title: {
    default: "Illoura Staff Admin",
    template: "%s | Illoura Staff Admin"
  },
  description: "Illoura Staff admin portal for Pulse on Green",
  icons: {
    icon: [
      { url: "/assets/pulse-logo.png", type: "image/png" },
    ],
    apple: [
      { url: "/assets/pulse-logo.png", type: "image/png" },
    ],
    shortcut: "/assets/pulse-logo.png",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning className="h-full overflow-x-hidden">
      <body className={`${albertSans.className} h-full overflow-x-hidden max-w-full`}>
        <ErrorHandler />
        <Providers>
          <SessionManager />
          <DashboardLayout>{children}</DashboardLayout>
        </Providers>
      </body>
    </html>
  )
}

