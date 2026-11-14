import type { Metadata } from "next"
import "./globals.css"
import { IntroVideoGate } from "../components/intro-video-gate"
import { EB_Garamond, Roboto } from "next/font/google"

const ebGaramond = EB_Garamond({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-eb-garamond", display: "swap" })
const roboto = Roboto({ subsets: ["latin"], weight: ["400", "500", "700"], variable: "--font-roboto", display: "swap" })

export const metadata: Metadata = { title: "CRYCODILE — $CROC on NEAR", description: "One community. One daily target. Every check-in counts." }

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body className={`${ebGaramond.variable} ${roboto.variable}`}><IntroVideoGate>{children}</IntroVideoGate></body></html> }
