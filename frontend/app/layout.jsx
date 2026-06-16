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
        {children}
        <ScrollToTop />
      </body>
    </html>
  );
}
