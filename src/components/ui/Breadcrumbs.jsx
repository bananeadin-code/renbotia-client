import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { SITE_URL } from '../../lib/seo.js';
import { Icon } from './Icon.jsx';

/**
 * Migas de pan (breadcrumbs): muestran la ruta jerárquica de la página y ayudan
 * a navegar. Inyecta además el schema BreadcrumbList para que Google la muestre
 * en los resultados de búsqueda.
 *
 * @param {{ items: {name: string, to?: string}[] }} props
 *   El último item suele ir sin `to` (es la página actual).
 */
export function Breadcrumbs({ items = [] }) {
  const key = JSON.stringify(items);
  useEffect(() => {
    if (!items.length) return undefined;
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: items.map((it, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: it.name,
        ...(it.to ? { item: `${SITE_URL}${it.to}` } : {}),
      })),
    };
    const s = document.createElement('script');
    s.type = 'application/ld+json';
    s.setAttribute('data-breadcrumb', 'true');
    s.text = JSON.stringify(schema);
    document.head.appendChild(s);
    return () => s.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  if (!items.length) return null;

  return (
    <nav
      aria-label="Ruta de navegación"
      className="mb-5 flex flex-wrap items-center gap-1 text-sm text-muted"
    >
      {items.map((it, i) => (
        <span key={i} className="flex items-center gap-1">
          {i > 0 && <Icon name="chevronRight" size={14} className="text-subtle" />}
          {it.to ? (
            <Link to={it.to} className="hover:text-fg">
              {it.name}
            </Link>
          ) : (
            <span className="font-medium text-fg" aria-current="page">
              {it.name}
            </span>
          )}
        </span>
      ))}
    </nav>
  );
}
