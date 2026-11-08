import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = { title: "$CROC on NEAR — Crying Croc", description: "One community. One daily target. Every check-in counts." }

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html> }
