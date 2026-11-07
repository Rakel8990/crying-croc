import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = { title: "Crying Croc — The Streak Coin", description: "Check in daily. Keep the streak alive. $CROC on NEAR." }

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html> }
