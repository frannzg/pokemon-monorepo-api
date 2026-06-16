import './globals.css';

export const metadata = {
  title: 'Pokemon Database',
  description: 'Browse pokemon from the PokeAPI',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
