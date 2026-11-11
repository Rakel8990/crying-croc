import type { Metadata } from "next"
import { StoryExperience } from "./story-experience"

export const metadata: Metadata = {
  title: "The Crycodile Story — $CROC on NEAR",
  description: "Seven chapters on how the Crycodile community shows up, shares rewards, and keeps the on-chain receipts.",
}

export default function StoryPage() {
  return <StoryExperience />
}
