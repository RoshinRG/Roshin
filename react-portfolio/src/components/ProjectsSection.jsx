import { useRef, useCallback } from 'react';
import projects from '../data/projects';
import useReveal from '../hooks/useReveal';

/* SVG icons — reused from the original HTML */
const GlobeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

const GitHubIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
  </svg>
);

const DELAY_CLASSES = ['', 'reveal--delay-1', 'reveal--delay-2', 'reveal--delay-3'];

function ProjectCard({ project, index }) {
  const cardRef = useRef(null);

  const handleMouseMove = useCallback((e) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) / (rect.width / 2);
    const dy = (e.clientY - cy) / (rect.height / 2);

    card.style.transform = `perspective(800px) rotateY(${dx * 8}deg) rotateX(${-dy * 6}deg) translateZ(6px)`;

    const mx = ((e.clientX - rect.left) / rect.width * 100).toFixed(1) + '%';
    const my = ((e.clientY - rect.top) / rect.height * 100).toFixed(1) + '%';
    card.style.setProperty('--mx', mx);
    card.style.setProperty('--my', my);
  }, []);

  const handleMouseLeave = useCallback(() => {
    const card = cardRef.current;
    if (card) card.style.transform = '';
  }, []);

  return (
    <article
      className={`project-card reveal ${DELAY_CLASSES[index] || ''}`}
      id={`projectCard${project.id}`}
      tabIndex="0"
      aria-label={`${project.title} project`}
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div className="project-card__num">{project.num}</div>
      <h3 className="project-card__title">{project.title}</h3>
      <p className="project-card__desc">{project.desc}</p>
      <div className="project-card__stack">
        {project.stack.map((tech) => (
          <span key={tech} className="project-card__tech">{tech}</span>
        ))}
      </div>
      <div className="project-card__links">
        <a
          href={project.liveUrl}
          target="_blank"
          rel="noopener"
          className="project-card__link"
          aria-label={`Live demo of ${project.title}`}
        >
          <GlobeIcon />
          Live Demo
        </a>
        <a
          href={project.githubUrl}
          target="_blank"
          rel="noopener"
          className="project-card__link"
          aria-label={`GitHub repository for ${project.title}`}
        >
          <GitHubIcon />
          GitHub
        </a>
      </div>
    </article>
  );
}

export default function ProjectsSection({ active }) {
  const sectionRef = useReveal();

  return (
    <section
      className={`section${active ? ' section--active' : ''}`}
      id="sectionProjects"
      aria-label="Projects"
      ref={sectionRef}
    >
      <div className="section-inner">
        <div className="section-header reveal">
          <span className="section-header__index">// 02</span>
          <h2 className="section-header__title">Things I've built.</h2>
          <p className="section-header__subtitle">
            A selection of production-quality projects — each a focused solution to a real
            problem.
          </p>
        </div>

        <div className="projects__grid">
          {projects.map((project, i) => (
            <ProjectCard key={project.id} project={project} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
