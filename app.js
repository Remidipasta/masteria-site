/* ══════════════════════════════════════════════════
   MASTERIA v3 — Light Particles + Interactions
   ══════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ── Background handled by CSS gradient blobs ── */

  /* ── Nav scroll ── */
  const nav = document.querySelector('.nav');
  let ticking = false;
  function onScroll() {
    if (!ticking) {
      requestAnimationFrame(() => {
        nav.classList.toggle('scrolled', window.scrollY > 40);
        ticking = false;
      });
      ticking = true;
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ── Mobile menu ── */
  const menuBtn = document.querySelector('.nav-menu-btn');
  const navLinks = document.querySelector('.nav-links');
  const navInner = document.querySelector('.nav-inner');

  // Safari/WebKit: backdrop-filter on .nav clips position:fixed children.
  // Move nav-links to body before opening so it escapes the compositing context.
  function openMenu() {
    document.body.appendChild(navLinks);
    navLinks.classList.add('open');
    menuBtn.classList.add('active');
    menuBtn.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }
  function closeMenu() {
    navLinks.classList.remove('open');
    menuBtn.classList.remove('active');
    menuBtn.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    navInner.insertBefore(navLinks, menuBtn);
  }

  if (menuBtn) {
    menuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      navLinks.classList.contains('open') ? closeMenu() : openMenu();
    });
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', closeMenu);
    });
    navLinks.addEventListener('click', (e) => {
      if (e.target === navLinks) closeMenu();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeMenu();
    });
  }

  /* ── Scroll reveal (all variants) ── */
  const revealSelectors = '.reveal, .reveal-left, .reveal-right, .reveal-scale, .reveal-flip, .reveal-up-big';
  const reveals = document.querySelectorAll(revealSelectors);
  if ('IntersectionObserver' in window) {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -30px 0px' });
    reveals.forEach(el => obs.observe(el));
  } else {
    reveals.forEach(el => el.classList.add('visible'));
  }

  /* ── Module card stagger (brique cards) ── */
  const mCards = document.querySelectorAll('.brique-card');
  if ('IntersectionObserver' in window && mCards.length) {
    const mObs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          const i = [...mCards].indexOf(e.target);
          e.target.style.transitionDelay = `${i * 0.05}s`;
          e.target.classList.add('visible');
          mObs.unobserve(e.target);
        }
      });
    }, { threshold: 0.06 });
    mCards.forEach(el => { el.classList.add('reveal'); mObs.observe(el); });
  }

  /* ── FAQ accordion ── */
  document.querySelectorAll('.faq-q').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.faq-item');
      const wasOpen = item.classList.contains('open');
      // Close all
      document.querySelectorAll('.faq-item.open').forEach(i => i.classList.remove('open'));
      // Toggle current
      if (!wasOpen) item.classList.add('open');
    });
  });

  /* ── Smooth anchor scroll ── */
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', function (e) {
      const t = document.querySelector(this.getAttribute('href'));
      if (t) {
        e.preventDefault();
        const navOffset = nav && getComputedStyle(nav).display !== 'none' ? nav.offsetHeight + 8 : 0;
        window.scrollTo({ top: t.getBoundingClientRect().top + window.scrollY - navOffset, behavior: 'smooth' });
      }
    });
  });

  /* ── Liquid Glass Bottom Nav ── */
  const liquidNav = document.getElementById('liquidNav');
  if (liquidNav) {
    const bubble = document.getElementById('lnavBubble');
    const inner = liquidNav.querySelector('.liquid-nav-inner');
    let lastScrollY = window.scrollY;
    let navTicking = false;
    // Éléments résolus une fois ici plutôt qu'à chaque frame de scroll dans le handler ci-dessous
    // (document.getElementById + getBoundingClientRect répétés à 60fps pendant tout le scroll).
    const navSections = [
      { id: 'hero',         link: liquidNav.querySelector('[href="#hero"]') },
      { id: 'programme',    link: liquidNav.querySelector('[href="#programme"]') },
      { id: 'performances', link: liquidNav.querySelector('[href="#performances"]') },
      { id: 'faq',          link: liquidNav.querySelector('[href="#faq"]') },
    ].map(s => ({ ...s, el: document.getElementById(s.id) }));

    function moveBubble(activeLink) {
      if (!bubble || !activeLink || activeLink.classList.contains('lnav-cta')) {
        if (bubble) bubble.style.opacity = '0';
        return;
      }
      const innerRect = inner.getBoundingClientRect();
      const linkRect  = activeLink.getBoundingClientRect();
      bubble.style.left    = (linkRect.left - innerRect.left) + 'px';
      bubble.style.width   = linkRect.width + 'px';
      bubble.style.opacity = '1';
    }

    window.addEventListener('scroll', () => {
      if (!navTicking) {
        requestAnimationFrame(() => {
          const currentY = window.scrollY;

          // Shrink on scroll down
          if (currentY > lastScrollY + 8 && currentY > 120) {
            liquidNav.classList.add('lnav-shrunk');
          } else if (currentY < lastScrollY - 8) {
            liquidNav.classList.remove('lnav-shrunk');
          }
          lastScrollY = currentY;

          // Active state + bulle
          let activeLink = null;
          navSections.forEach(({ link, el }) => {
            if (!link || !el) return;
            const rect = el.getBoundingClientRect();
            if (rect.top <= 120 && rect.bottom >= 120) {
              link.classList.add('lnav-active');
              activeLink = link;
            } else {
              link.classList.remove('lnav-active');
            }
          });
          moveBubble(activeLink);

          navTicking = false;
        });
        navTicking = true;
      }
    }, { passive: true });

    // Init bubble on page load
    setTimeout(() => {
      const first = liquidNav.querySelector('[href="#hero"]');
      if (first) moveBubble(first);
    }, 100);
  }
})();
