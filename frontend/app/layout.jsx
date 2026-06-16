import './globals.css';

import ScrollToTop from '../components/ScrollToTop';

export const metadata = {
  title: 'Pokédex - Pokemon Database',
  description: 'Browse all pokemon from the PokeAPI with stats, filters and more.',
  icons: { icon: '/favicon.svg' },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <nav className="nav">
          <div className="nav-inner">
            <a href="/" className="nav-brand">Pokédex</a>
            <div className="nav-links">
              <a href="/" className="nav-link">Browse</a>
              <a href="/teams" className="nav-link">Teams</a>
            </div>
          </div>
        </nav>
        {children}
        <ScrollToTop />
      </body>
    </html>
  );
}
