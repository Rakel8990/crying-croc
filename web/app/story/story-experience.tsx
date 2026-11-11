"use client"

import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { ArrowDown, ArrowLeft, ArrowUpRight } from "lucide-react"

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
    copy: "Hit the daily target. Create new CROC. Share 90% among the day's checkers.",
    tag: "90% TO THE DAY'S CHECKERS",
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
    copy: "No admin. No changing the rules. What's written in the contract stays.",
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
    copy: "A crocodile with a reason to cry. A community with a reason to show up. That's Crycodile.",
    tag: "$CROC ON NEAR",
  },
]

export function StoryExperience() {
  const scrollerRef = useRef<HTMLDivElement>(null)
  const [activeChapter, setActiveChapter] = useState(0)

  useEffect(() => {
    const scroller = scrollerRef.current
    if (!scroller) return

    const sections = Array.from(scroller.querySelectorAll<HTMLElement>("[data-chapter]"))
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          const index = Number((entry.target as HTMLElement).dataset.chapter)
          setActiveChapter(index)
          entry.target.querySelector(".story-copy")?.classList.add("is-active")
        }
      },
      { root: scroller, threshold: 0.62 },
    )

    sections.forEach((section) => observer.observe(section))
    return () => observer.disconnect()
  }, [])

  return (
    <main className="story-page">
      <video className="background-video story-video" src="https://files.catbox.moe/2pu9xu.mp4" autoPlay muted loop playsInline preload="auto" aria-hidden="true" />
      <div className="story-video-shade" aria-hidden="true" />
      <div className="story-grain" aria-hidden="true" />

      <header className="story-topbar">
        <Link className="story-back" href="/"><ArrowLeft aria-hidden="true" /> <span>BACK TO $CROC</span></Link>
        <span className="story-label"><span className="live-dot" /> THE CRYCODILE STORY</span>
        <span className="story-count">{String(activeChapter + 1).padStart(2, "0")} <i>/</i> 07</span>
      </header>

      <nav className="story-progress" aria-label="Story chapters">
        {chapters.map((chapter, index) => (
          <a
            key={chapter.number}
            href={`#chapter-${chapter.number}`}
            aria-label={`Chapter ${chapter.number}: ${chapter.tag}`}
            aria-current={activeChapter === index ? "step" : undefined}
            className={activeChapter === index ? "is-active" : undefined}
            onClick={(event) => {
              event.preventDefault()
              scrollerRef.current?.querySelector(`#chapter-${chapter.number}`)?.scrollIntoView({ behavior: "smooth" })
            }}
          >
            <span>{chapter.number}</span>
          </a>
        ))}
      </nav>

      <div className="story-scroll" ref={scrollerRef}>
        {chapters.map((chapter, index) => (
          <section className="story-chapter" id={`chapter-${chapter.number}`} data-chapter={index} key={chapter.number} aria-labelledby={`story-title-${chapter.number}`}>
            <div className="story-chapter-inner">
              <div className="story-chapter-meta"><span>CHAPTER {chapter.number}</span><span>{chapter.tag}</span></div>
              <div className="story-copy">
                <span className="story-index">{chapter.number}</span>
                {index === 0 ? (
                  <h1 id={`story-title-${chapter.number}`} data-glitch={chapter.title}>{chapter.title}</h1>
                ) : (
                  <h2 id={`story-title-${chapter.number}`} data-glitch={chapter.title}>{chapter.title}</h2>
                )}
                <p>{chapter.copy}</p>
              </div>
              <div className="story-chapter-bottom">
                <span className="story-coordinate">CROC / NEAR / {chapter.number}</span>
                {index < chapters.length - 1 ? (
                  <a className="story-next" href={`#chapter-${chapters[index + 1].number}`} onClick={(event) => {
                    event.preventDefault()
                    scrollerRef.current?.querySelector(`#chapter-${chapters[index + 1].number}`)?.scrollIntoView({ behavior: "smooth" })
                  }}>
                    <span>KEEP GOING</span><ArrowDown aria-hidden="true" />
                  </a>
                ) : (
                  <Link className="story-next" href="/mechanic"><span>THE MECHANIC</span><ArrowUpRight aria-hidden="true" /></Link>
                )}
              </div>
            </div>
            <span className="story-watermark" aria-hidden="true">CROC</span>
          </section>
        ))}
      </div>

      <Link className="story-mechanic-link" href="/mechanic">THE MECHANIC <ArrowUpRight aria-hidden="true" /></Link>
    </main>
  )
}
