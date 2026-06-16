import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="container">
      <div className="not-found">
        <div className="pokeball-icon" style={{ width: 80, height: 80 }} />
        <h1>404</h1>
        <p>Wild page fled!</p>
        <Link href="/" className="btn btn-header" style={{ textDecoration: 'none' }}>
          &larr; Back to safety
        </Link>
      </div>
    </div>
  );
}
