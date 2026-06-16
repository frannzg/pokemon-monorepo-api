import './globals.css';

import ScrollToTop from '../components/ScrollToTop';
import NavBar from '../components/NavBar';
import { ToastProvider } from '../components/Toast';

export const metadata = {
  title: 'Pokédex - Pokemon Database',
  description: 'Browse all pokemon from the PokeAPI with stats, filters and more.',
  icons: { icon: '/favicon.svg' },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
      <head>
        <script dangerouslySetInnerHTML={{
          __html: `(function(){try{var t=localStorage.getItem('pokemon-theme');if(!t){t=window.matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light'}document.documentElement.setAttribute('data-theme',t)}catch(e){}})()`
        }} />
      </head>
      <body>
        <ToastProvider>
          <NavBar />
          {children}
          <ScrollToTop />
        </ToastProvider>
      </body>
    </html>
  );
}
