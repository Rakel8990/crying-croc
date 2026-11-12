"use client"

import Link from "next/link"
import { ArrowDown, ArrowUpRight } from "lucide-react"
import { useEffect, useRef, useState } from "react"

const chapters = [
  {
    number: "01",
    title: "THE COMMUNITY MAKES THE RULES WORK.",
    copy: "The community decides what happens next. Every check-in brings the pond closer to its daily goal.",
    tag: "IT STARTS WITH SHOWING UP",
  },
  {
    number: "02",
    title: "EVERY DAY IS A NEW ROUND.",
    copy: "One day. One target. Every registered wallet gets one chance to show up.",
    tag: "ONE CHECK-IN PER DAY",
  },
  {
    number: "03",
    title: "NOBODY WINS ALONE.",
    copy: "Hit the daily target. Create new CROC. Share 90% among the day’s checkers.",
    tag: "90% TO THE DAY’S CHECKERS",
  },
  {
    number: "04",
    title: "NO CHECK-INS. NO MERCY.",
    copy: "Miss the target. Croc cries. 5% of the treasury gets burned.",
    tag: "THE BURN IS REAL",
  },
  {
    number: "05",
    title: "NOBODY HOLDS THE KEYS.",
    copy: "No admin. No changing the rules. What’s written in the contract stays.",
    tag: "RULES SET IN THE CONTRACT",
  },
  {
    number: "06",
    title: "ON-CHAIN RECORD.",
    copy: "Every check-in. Every reward. Every burn. The blockchain keeps the receipts.",
    tag: "EVERY ACTION LEAVES A TRACE",
  },
  {
    number: "07",
    title: "THE TEARS ARE FAKE. THE BURN IS REAL.",
    copy: "A crocodile with a reason to cry. A community with a reason to show up. That’s Crycodile.",
    tag: "$CROC ON NEAR",
  },
]

export function StoryExperience() {
  const storyRef = useRef<HTMLElement>(null)
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

  const currentChapter = chapters[activeChapter]

  return (
    <section className="home-story" id="story" ref={storyRef} aria-labelledby="story-heading">
      <header className="home-story-intro">
        <div>
          <span className="section-kicker">THE CRYCODILE STORY</span>
          <h2 id="story-heading">A community built<br /><span>on showing up.</span></h2>
        </div>
        <p>One daily check-in. One shared goal. A different ending each day.</p>
      </header>

      <div className="home-story-progress">
        <span className="home-story-progress-label">CHAPTER {currentChapter.number} / 07</span>
        <div
          className="home-story-progress-track"
          role="progressbar"
          aria-label="Story progress"
          aria-valuemin={1}
          aria-valuemax={chapters.length}
          aria-valuenow={activeChapter + 1}
          aria-valuetext={`Chapter ${currentChapter.number}: ${currentChapter.tag}`}
        >
          <span style={{ width: `${((activeChapter + 1) / chapters.length) * 100}%` }} />
        </div>
        <span className="home-story-progress-tag">{currentChapter.tag}</span>
      </div>

      <div className="home-story-chapters">
        {chapters.map((chapter, index) => {
          const nextChapter = chapters[index + 1]

          return (
            <article
              className="home-story-chapter"
              id={`story-chapter-${chapter.number}`}
              data-story-chapter={index}
              key={chapter.number}
              aria-labelledby={`story-heading-${chapter.number}`}
            >
              <div className="home-story-index" aria-hidden="true">
                <span>{chapter.number}</span>
                <small> / 07</small>
              </div>
              <div className="home-story-copy">
                <span className="home-story-tag">{chapter.tag}</span>
                <h3 id={`story-heading-${chapter.number}`} data-glitch={chapter.title}>{chapter.title}</h3>
                <p>{chapter.copy}</p>
                <div className="home-story-footer">
                  <span>CROC / NEAR / {chapter.number}</span>
                  {nextChapter ? (
                    <a className="home-story-next" href={`#story-chapter-${nextChapter.number}`}>
                      NEXT CHAPTER <ArrowDown aria-hidden="true" />
                    </a>
                  ) : (
                    <Link className="home-story-next" href="/mechanic">
                      THE MECHANIC <ArrowUpRight aria-hidden="true" />
                    </Link>
                  )}
                </div>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
