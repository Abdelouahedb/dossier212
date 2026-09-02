/**
 * DOSSIER 212 - Public JavaScript
 */

document.addEventListener('DOMContentLoaded', () => {
  initMobileMenu();
  initThemeToggle();
  initLanguageToggle();
  initScrollAnimations();
  initStickyHeader();
  initReadingProgress();
});

/**
 * Mobile Menu Toggle
 */
function initMobileMenu() {
  const btn = document.querySelector('.mobile-menu-btn, .nav-hamburger');
  const menu = document.querySelector('.nav-links');
  
  if (!btn || !menu) return;

  const toggleMenu = () => {
    menu.classList.toggle('active');
    document.body.style.overflow = menu.classList.contains('active') ? 'hidden' : '';
  };

  btn.addEventListener('click', toggleMenu);

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (menu.classList.contains('active') && !menu.contains(e.target) && !btn.contains(e.target)) {
      toggleMenu();
    }
  });

  // Close on ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menu.classList.contains('active')) {
      toggleMenu();
    }
  });
}

/**
 * Theme Toggle
 */
function initThemeToggle() {
  const toggleBtns = document.querySelectorAll('.theme-toggle, .nav-theme-toggle');
  
  let currentTheme = localStorage.getItem('dossier212_theme') || 
                     document.documentElement.getAttribute('data-theme') || 
                     'dark';
  
  // Apply saved theme on load
  document.documentElement.setAttribute('data-theme', currentTheme);
                     
  const updateIcons = (theme) => {
    toggleBtns.forEach(btn => {
      const icon = btn.querySelector('.theme-icon');
      if (icon) {
        icon.textContent = theme === 'dark' ? '☀' : '☾';
      } else {
        btn.textContent = theme === 'dark' ? '☀' : '☾';
      }
    });
  };

  updateIcons(currentTheme);

  toggleBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', currentTheme);
      localStorage.setItem('dossier212_theme', currentTheme);
      updateIcons(currentTheme);
    });
  });
}

/**
 * Language Toggle highlight
 */
function initLanguageToggle() {
  const currentLang = document.documentElement.lang || 'fr';
  const langLinks = document.querySelectorAll('.lang-toggle a, .nav-lang a');
  
  langLinks.forEach(link => {
    if (link.getAttribute('href').includes(currentLang)) {
      link.classList.add('active');
    }
  });
}

/**
 * Scroll Animations using IntersectionObserver
 */
function initScrollAnimations() {
  const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1
  };

  const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target); // Run once
      }
    });
  }, observerOptions);

  document.querySelectorAll('.fade-in, .reveal').forEach(el => {
    observer.observe(el);
  });
}

/**
 * Sticky Header effects
 */
function initStickyHeader() {
  const header = document.querySelector('.nav-bar');
  if (!header) return;

  const handleScroll = () => {
    if (window.scrollY > 50) {
      header.classList.add('nav-scrolled');
      header.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
    } else {
      header.classList.remove('nav-scrolled');
      header.style.boxShadow = 'none';
    }
  };

  window.addEventListener('scroll', handleScroll, { passive: true });
}

/**
 * Reading Progress Bar
 */
function initReadingProgress() {
  const progressBar = document.querySelector('.reading-progress');
  const article = document.querySelector('.dossier-content');
  
  if (!progressBar || !article) return;

  const updateProgress = () => {
    const rect = article.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    
    // Calculate how much of the article has been scrolled past
    const totalHeight = rect.height;
    const scrolled = windowHeight - rect.top;
    
    let progress = (scrolled / totalHeight) * 100;
    
    // Clamp between 0 and 100
    progress = Math.max(0, Math.min(100, progress));
    
    progressBar.style.width = `${progress}%`;
  };

  window.addEventListener('scroll', updateProgress, { passive: true });
  updateProgress(); // init
}

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const targetId = this.getAttribute('href');
        if (targetId === '#') return;
        
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
            e.preventDefault();
            targetElement.scrollIntoView({
                behavior: 'smooth'
            });
        }
    });
});
