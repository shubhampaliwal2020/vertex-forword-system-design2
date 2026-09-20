import { SignInButton, SignUpButton, Show, UserButton } from "@clerk/nextjs";

const courses = [
  {
    mark: "N",
    markClass: "next-mark",
    title: "Next.js for Production",
    description: "Build scalable, high-performance web applications with Next.js.",
    level: "Intermediate",
    duration: "18h 24m",
    modules: "12 modules",
  },
  {
    mark: "docker",
    markClass: "docker-mark",
    title: "Docker Essentials",
    description: "Containerize applications and streamline your development workflow.",
    level: "Beginner",
    duration: "10h 12m",
    modules: "8 modules",
  },
  {
    mark: "TS",
    markClass: "typescript-mark",
    title: "TypeScript Deep Dive",
    description: "Go beyond the basics and write safer, more expressive code.",
    level: "Intermediate",
    duration: "14h 36m",
    modules: "10 modules",
  },
];

function VertexMark() {
  return <span className="vertex-mark" aria-hidden="true">V</span>;
}

function Arrow() {
  return <span className="arrow" aria-hidden="true">&#8594;</span>;
}

function SearchIcon() {
  return <span className="search-icon" aria-hidden="true" />;
}

function BellIcon() {
  return <span className="bell-icon" aria-hidden="true" />;
}

function CourseIcon({ type }: { type: string }) {
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

export default function Home() {
  return (
    <main className="home-shell">
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Vertex home"><VertexMark /><strong>Vertex</strong></a>
        <nav className="main-nav" aria-label="Main navigation">
          <a href="#courses">Courses</a>
          <a href="#learning">My Learning</a>
        </nav>
        <div className="header-actions">
          <button className="icon-button" type="button" aria-label="Notifications"><BellIcon /></button>
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
        <a className="primary-button" href="#courses">Explore Courses <Arrow /></a>
        <form className="search-box" role="search" action="#courses">
          <SearchIcon />
          <input aria-label="Search your learning" placeholder="Ask anything about your learning..." />
          <kbd><span aria-hidden="true">&#8984;</span> K</kbd>
        </form>
      </section>

      <section className="courses-section" id="courses" aria-labelledby="courses-title">
        <div className="section-heading"><h2 id="courses-title">All Courses</h2><a href="#courses">View all courses <Arrow /></a></div>
        <div className="course-grid">
          {courses.map((course) => (
            <a className="course-card" href="#learning" key={course.title}>
              <CourseIcon type={course.markClass} />
              <h3>{course.title}</h3>
              <p>{course.description}</p>
              <div className="course-meta">
                <span><i className="level-icon" aria-hidden="true" />{course.level}</span>
                <span><i className="clock-icon" aria-hidden="true" />{course.duration}</span>
                <span><i className="module-icon" aria-hidden="true" />{course.modules}</span>
              </div>
            </a>
          ))}
        </div>
      </section>

      <section className="announcement" id="learning" aria-label="Vertex update">
        <span className="rule" /><p><span aria-hidden="true">☆</span> New courses and lessons added every week.</p><span className="rule" />
      </section>
      <div className="cityscape" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /></div>
    </main>
  );
}
