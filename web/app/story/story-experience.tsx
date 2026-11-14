"use client"

import { useEffect, useRef, useState } from "react"

const parameters = [
  ["Maximum supply", "1,000,000,000 CROC"],
  ["Initial treasury", "300,000,000 CROC"],
  ["Emission pool", "700,000,000 CROC"],
  ["Daily target", "5 check-ins / 24 hours"],
  ["Admin keys", "Deleted (0 access keys)"],
  ["Presale", "None"],
  ["Team allocation", "None"],
]

const chapters = [
  {
    number: "01",
    title: "THE COMMUNITY MAKES THE RULES WORK.",
    copy: "The community decides what happens next. Every check-in brings the pond closer to its daily goal of 5 check-ins.",
  },
  {
    number: "02",
    title: "EVERY DAY IS A NEW ROUND.",
    copy: "One 24-hour day. Target 5. Every registered testnet wallet gets one check-in per day.",
  },
  {
    number: "03",
    title: "NOBODY WINS ALONE.",
    copy: "Hit target 5: 0.5% leaves the pool. Share 90% among the day’s checkers and 10% to treasury. Milestones at 7, 15, 25, 100 days.",
  },
  {
    number: "04",
    title: "NO CHECK-INS. NO MERCY.",
    copy: "Miss the target: Croc cries. 5% of the treasury gets burned and the streak resets to 0.",
  },
  {
    number: "05",
    title: "NOBODY HOLDS THE KEYS.",
    copy: "No admin keys. No upgrade path. What’s written in the deployed smart contract stays forever.",
  },
  {
    number: "06",
    title: "ON-CHAIN RECORD.",
    copy: "Every check-in, mint, burn, claim, milestone, and streak change is recorded on NEAR testnet.",
  },
  {
    number: "07",
    title: "THE TEARS ARE FAKE. THE BURN IS REAL.",
    copy: "A crocodile with a reason to cry. A community with a reason to show up. That’s Crycodile.",
  },
]

export function StoryExperience() {
  const storyRef = useRef<HTMLElement | null>(null)
  const [activeChapter, setActiveChapter] = useState(0)

  useEffect(() => {
    const story = storyRef.current
    if (!story) return

    const sections = Array.from(story.querySelectorAll<HTMLElement>("[data-story-chapter]"))
    story.classList.add("has-observer")

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((first, second) => second.intersectionRatio - first.intersectionRatio)[0]

        if (!visible) return

        const section = visible.target as HTMLElement
        const index = Number(section.dataset.storyChapter)
        setActiveChapter(index)
        section.querySelector(".home-story-copy")?.classList.add("is-visible")
      },
      { threshold: [0.25, 0.45, 0.65], rootMargin: "-12% 0px -18% 0px" },
    )

    sections.forEach((section) => observer.observe(section))
    return () => observer.disconnect()
  }, [])

  return (
    <section className="home-story" id="story" ref={storyRef} aria-labelledby="story-heading">
      <header className="home-story-intro">
        <div className="home-story-intro-copy">
          <span className="section-kicker">THE CRYCODILE STORY</span>
          <h2 id="story-heading">A community built<br /><span>on showing up.</span></h2>
          <p>Target 5. 24-hour days. A different ending each day on NEAR Testnet.</p>
        </div>

        <div className="home-story-parameters-card" role="group" aria-labelledby="home-story-parameters-title">
          <div className="home-story-parameters-heading">
            <h3 id="home-story-parameters-title">TOKEN PARAMETERS</h3>
            <span>NEAR / TESTNET</span>
          </div>
          <dl className="home-story-parameters">
            {parameters.map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </header>

      <div className="home-story-chapters">
        {chapters.map((chapter, index) => (
          <article
            className={`home-story-chapter${activeChapter === index ? " is-active" : ""}`}
            id={`story-chapter-${chapter.number}`}
            data-story-chapter={index}
            key={chapter.number}
            aria-labelledby={`story-heading-${chapter.number}`}
            aria-current={activeChapter === index ? "step" : undefined}
            style={{ zIndex: index + 2 }}
          >
            <div className="home-story-index" aria-hidden="true">
              <span>{chapter.number}</span>
            </div>
            <div className="home-story-copy">
              <h3 id={`story-heading-${chapter.number}`} data-glitch={chapter.title}>{chapter.title}</h3>
              <p>{chapter.copy}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
