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
    return <span className="docker-whale" aria-hidden="true"><i /><i /><i /><i /><i /></span>;
  }
  return <span className={`course-mark ${type}`} aria-hidden="true">{type === "next-mark" ? "N" : "TS"}</span>;
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
          <button className="avatar" type="button" aria-label="Open profile menu">A</button>
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
