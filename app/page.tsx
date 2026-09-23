import Link from "next/link";
import { SignInButton, SignUpButton, Show, UserButton } from "@clerk/nextjs";
import { ArrowRight, Bell, Clock3, Gauge, Layers3, Search, Sparkles } from "lucide-react";
import { getCourses } from "../sanity/lib/data";
import { urlFor } from "../sanity/lib/image";
import { fallbackCourses } from "./course/fallbackData";

function VertexMark() {
  return <Sparkles className="vertex-mark" aria-hidden="true" strokeWidth={2.4} />;
}

function CourseIcon({ type, imageUrl }: { type: string; imageUrl?: string | null }) {
  if (imageUrl) {
    return <span className="course-card-cover" style={{ backgroundImage: `url(${imageUrl})` }} aria-hidden="true" />;
  }

  if (type === "docker-mark") {
    return (
      <span className="docker-whale" aria-hidden="true">
        <svg viewBox="0 0 88 78" role="presentation">
          <path className="docker-body" d="M9 39h52c6 0 11-3 15-8 5 3 8 7 9 12-5 8-14 13-25 13H26C17 56 10 51 9 39Z" />
          <path className="docker-neck" d="M61 38c2-8 7-12 14-13 2 2 3 5 3 8-4 1-7 3-9 7" />
          <path className="docker-wave" d="M18 60c9 6 19 8 30 7 11-1 19-5 25-12" />
          <rect x="18" y="26" width="9" height="9" rx="1" />
          <rect x="30" y="26" width="9" height="9" rx="1" />
          <rect x="42" y="26" width="9" height="9" rx="1" />
          <rect x="30" y="15" width="9" height="9" rx="1" />
          <rect x="42" y="15" width="9" height="9" rx="1" />
        </svg>
      </span>
    );
  }
  return (
    <span className={`course-mark ${type}`} aria-hidden="true">
      {type === "next-mark" ? <><b>N</b><i>JS</i></> : <><b>TS</b><i>type safe</i></>}
    </span>
  );
}

function durationInMinutes(duration?: string | number) {
  if (typeof duration === "number") return Math.round(duration / 60);
  if (!duration) return 0;

  const hours = duration.match(/(\d+)h/)?.[1];
  const minutes = duration.match(/(\d+)m/)?.[1];
  return (hours ? Number(hours) * 60 : 0) + (minutes ? Number(minutes) : 0);
}

function formatDuration(minutes: number) {
  if (!minutes) return "Duration unavailable";
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return hours ? `${hours}h ${remainingMinutes}m` : `${remainingMinutes}m`;
}

function imageUrlFor(source: unknown) {
  if (!source) return null;

  try {
    return urlFor(source as Parameters<typeof urlFor>[0]).width(640).height(360).fit("crop").url();
  } catch {
    return null;
  }
}

export default async function Home() {
  const coursesData = await getCourses();
  const courses = coursesData.length ? coursesData : Object.values(fallbackCourses);

  return (
    <main className="home-shell">
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Vertex home"><VertexMark /><strong>Vertex</strong></a>
        <nav className="main-nav" aria-label="Main navigation">
          <a href="#courses">Courses</a>
          <a href="#learning">My Learning</a>
        </nav>
        <div className="header-actions">
          <button className="icon-button" type="button" aria-label="Notifications"><Bell size={20} strokeWidth={1.8} /></button>
          <Show when="signed-out">
            <SignInButton mode="modal">
              <button className="auth-link" type="button">Sign in</button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button className="auth-button" type="button">Get started</button>
            </SignUpButton>
          </Show>
          <Show when="signed-in">
            <UserButton />
          </Show>
        </div>
      </header>

      <section className="hero" id="top" aria-labelledby="hero-title">
        <p className="eyebrow">Intelligent learning</p>
        <h1 id="hero-title">Search your learning<br />in plain English.</h1>
        <p className="hero-copy">Vertex understands what you want to learn and<br className="desktop-only" /> finds the exact lessons across all your courses.</p>
        <a className="primary-button" href="#courses">Explore Courses <ArrowRight className="arrow" aria-hidden="true" /></a>
        <form className="search-box" role="search" action="/search" method="get">
          <Search className="search-icon" aria-hidden="true" />
          <input name="q" aria-label="Search your learning" placeholder="Ask anything about your learning..." />
          <kbd><span aria-hidden="true">&#8984;</span> K</kbd>
        </form>
      </section>

      <section className="courses-section" id="courses" aria-labelledby="courses-title">
        <div className="section-heading"><h2 id="courses-title">All Courses</h2><a href="#courses">View all courses <ArrowRight className="arrow" aria-hidden="true" /></a></div>
        <div className="course-grid">
          {courses.map((course, index) => {
            const slug = course.slug?.current ?? `course-${index + 1}`;
            const type = slug.includes("docker") ? "docker-mark" : slug.includes("typescript") ? "typescript-mark" : "next-mark";
            const level = course.level ?? "Level unavailable";
            const duration = course.duration
              ? typeof course.duration === "number" ? formatDuration(durationInMinutes(course.duration)) : course.duration
              : formatDuration((course.modules ?? []).flatMap((module) => module.lessons ?? []).reduce((total, lesson) => total + durationInMinutes(lesson.duration), 0));
            const modulesCount = Array.isArray(course.modules) ? course.modules.length : 0;
            const summary = course.summary ?? "Learn the core concepts and production patterns behind this course.";
            const imageUrl = imageUrlFor(course.coverImage);

            return (
              <Link className="course-card" href={`/course/${slug}`} key={slug}>
                <CourseIcon type={type} imageUrl={imageUrl} />
                <h3>{course.title}</h3>
                <p>{summary}</p>
                <div className="course-meta">
                  <span><Gauge className="meta-icon" aria-hidden="true" />{level}</span>
                  <span><Clock3 className="meta-icon" aria-hidden="true" />{duration}</span>
                  <span><Layers3 className="meta-icon" aria-hidden="true" />{modulesCount || 1} modules</span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="announcement" id="learning" aria-label="Vertex update">
        <span className="rule" /><p><span aria-hidden="true">☆</span> New courses and lessons added every week.</p><span className="rule" />
      </section>
      <div className="cityscape" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /></div>
    </main>
  );
}
