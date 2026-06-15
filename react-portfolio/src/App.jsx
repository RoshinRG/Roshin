import { useState, useCallback, useEffect } from 'react';
import CustomCursor from './components/CustomCursor';
import PageTransition from './components/PageTransition';
import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import AboutSection from './components/AboutSection';
import ProjectsSection from './components/ProjectsSection';
import SkillsSection from './components/SkillsSection';
import ContactSection from './components/ContactSection';
import Footer from './components/Footer';
import Toast, { useToast } from './components/Toast';

const SECTIONS = ['hero', 'about', 'projects', 'skills', 'contact'];

export default function App() {
  const [currentSection, setCurrentSection] = useState('hero');
  const [transitioning, setTransitioning] = useState(false);
  const { toast, showToast } = useToast();

  const navigateTo = useCallback(
    (section) => {
      if (section === currentSection || !SECTIONS.includes(section)) return;

      setTransitioning(true);

      setTimeout(() => {
        setCurrentSection(section);
        window.scrollTo({ top: 0, behavior: 'instant' });
        setTransitioning(false);
      }, 200);
    },
    [currentSection]
  );

  /* Keyboard navigation — arrow keys */
  useEffect(() => {
    const onKeyDown = (e) => {
      const idx = SECTIONS.indexOf(currentSection);
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        if (idx < SECTIONS.length - 1) navigateTo(SECTIONS[idx + 1]);
      }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        if (idx > 0) navigateTo(SECTIONS[idx - 1]);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [currentSection, navigateTo]);

  return (
    <>
      <CustomCursor />
      <PageTransition active={transitioning} />

      <Navbar currentSection={currentSection} onNavigate={navigateTo} />

      <HeroSection active={currentSection === 'hero'} onNavigate={navigateTo} />
      <AboutSection active={currentSection === 'about'} />
      <ProjectsSection active={currentSection === 'projects'} />
      <SkillsSection active={currentSection === 'skills'} />
      <ContactSection active={currentSection === 'contact'} showToast={showToast} />

      <Footer onNavigate={navigateTo} />
      <Toast visible={toast.visible} message={toast.message} isError={toast.isError} />
    </>
  );
}
