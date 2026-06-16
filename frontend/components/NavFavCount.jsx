'use client';

import { useState, useEffect } from 'react';

export default function NavFavCount() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const update = () => {
      try {
        const favs = JSON.parse(localStorage.getItem('pokemon-favs') || '[]');
        setCount(favs.length);
      } catch { setCount(0); }
    };
    update();
    const interval = setInterval(update, 1500);
    return () => clearInterval(interval);
  }, []);

  if (count === 0) return null;

  return <span className="nav-fav-count">{count}</span>;
}
