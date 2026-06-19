'use client';

import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import NavFavCount from './NavFavCount';
import ThemeToggle from './ThemeToggle';

const links = [
  { href: '/', label: 'Browse' },
  { href: '/abilities', label: 'Abilities' },
  { href: '/compare', label: 'Compare' },
  { href: '/teams', label: 'Teams' },
  { href: '/battle', label: 'Battle' },
  { href: '/pokedex-book', label: 'Pokédex' },
  { href: '/trainer-card', label: 'Trainer Card' },
];

export default function NavBar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <nav className="nav">
      <div className="nav-inner">
        <a href="/" className="nav-brand">
          <span className="nav-pokeball" />
          <span className="nav-brand-text">Pokédex</span>
        </a>

        <button className={`nav-hamburger ${open ? 'open' : ''}`} onClick={() => setOpen(!open)} aria-label="Menu">
          <span /><span /><span />
        </button>

        <div className={`nav-links ${open ? 'open' : ''}`}>
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={`nav-link ${pathname === link.href ? 'active' : ''}`}
            >
              {link.label}
            </a>
          ))}
          <ThemeToggle />
          <a href="/" className={`nav-link nav-fav-link ${pathname === '/' ? 'active' : ''}`}>
            ★<NavFavCount />
          </a>
        </div>
      </div>
    </nav>
  );
}
