import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { connectionsApi, widgetApi } from '../../api/endpoints.js';
import { Card, Badge, Spinner } from '../ui/index.jsx';
import { Icon } from '../ui/Icon.jsx';

/**
 * Panel informativo de canales conectados (solo datos). La conexión real se
 * gestiona en Conexiones; aquí se muestra el número de WhatsApp asociado al bot
 * y el de Facebook Messenger e Instagram, más el chat del sitio web.
 */
export function ConnectedChannels() {
  const [data, setData] = useState(null);
  const [web, setWeb] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([connectionsApi.get().catch(() => null), widgetApi.get().catch(() => null)])
      .then(([conn, widget]) => {
        setData(conn);
        setWeb(widget);
      })
      .finally(() => setLoading(false));
  }, []);

  const wa = data?.whatsapp;
  const connected = Boolean(wa?.connected);

  return (
    <Card>
      <h2 className="font-semibold text-fg">Canales conectados</h2>
      <p className="mt-1 text-sm text-muted">
        Los canales que atiende tu bot. La conexión se gestiona en{' '}
        <Link to="/dashboard/conexiones" className="font-medium text-brand-600 hover:underline">
          Conexiones
        </Link>
        .
      </p>

      {loading ? (
        <div className="mt-4 flex justify-center py-4">
          <Spinner className="text-brand-600" />
        </div>
      ) : (
        <div className="mt-4 space-y-2">
          {/* WhatsApp */}
          <div className="flex items-center justify-between gap-3 rounded-lg border border-line bg-surface2/40 px-3 py-2.5">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-500/10 text-brand-600">
                <Icon name="whatsapp" size={18} />
              </span>
              <div className="min-w-0">
                <div className="text-sm font-medium text-fg">WhatsApp</div>
                <div className="truncate text-xs text-subtle">
                  {connected
                    ? `${wa.phoneNumber || 'Número conectado'}${wa.verifiedName ? ` · ${wa.verifiedName}` : ''}`
                    : 'Sin conectar'}
                </div>
              </div>
            </div>
            {connected ? (
              <Badge color="green">Conectado</Badge>
            ) : (
              <Link
                to="/dashboard/conexiones"
                className="shrink-0 text-xs font-semibold text-brand-600 hover:underline"
              >
                Conectar
              </Link>
            )}
          </div>

          {/* Facebook Messenger */}
          {data?.messengerEnabled || data?.messenger?.connected ? (
            <div className="flex items-center justify-between gap-3 rounded-lg border border-line bg-surface2/40 px-3 py-2.5">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#0866FF]/10 text-[#0866FF]">
                  <Icon name="messenger" size={18} />
                </span>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-fg">Messenger</div>
                  <div className="truncate text-xs text-subtle">
                    {data?.messenger?.connected ? data.messenger.pageName || 'Página conectada' : 'Sin conectar'}
                  </div>
                </div>
              </div>
              {data?.messenger?.connected ? (
                <Badge color="green">Conectado</Badge>
              ) : (
                <Link
                  to="/dashboard/conexiones?canal=messenger"
                  className="shrink-0 text-xs font-semibold text-brand-600 hover:underline"
                >
                  Conectar
                </Link>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3 rounded-lg border border-dashed border-line px-3 py-2.5 opacity-70">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface2 text-subtle">
                  <Icon name="messenger" size={16} />
                </span>
                <div className="text-sm font-medium text-fg">Messenger</div>
              </div>
              <span className="shrink-0 rounded-full bg-surface2 px-2 py-0.5 text-[10px] font-medium text-muted">
                Próximamente
              </span>
            </div>
          )}

          {/* Instagram */}
          {data?.instagramEnabled || data?.instagram?.connected ? (
            <div className="flex items-center justify-between gap-3 rounded-lg border border-line bg-surface2/40 px-3 py-2.5">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#E1306C]/10 text-[#E1306C]">
                  <Icon name="instagram" size={18} />
                </span>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-fg">Instagram</div>
                  <div className="truncate text-xs text-subtle">
                    {data?.instagram?.connected ? `@${data.instagram.username || 'cuenta conectada'}` : 'Sin conectar'}
                  </div>
                </div>
              </div>
              {data?.instagram?.connected ? (
                <Badge color="green">Conectado</Badge>
              ) : (
                <Link
                  to="/dashboard/conexiones?canal=instagram"
                  className="shrink-0 text-xs font-semibold text-brand-600 hover:underline"
                >
                  Conectar
                </Link>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3 rounded-lg border border-dashed border-line px-3 py-2.5 opacity-70">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface2 text-subtle">
                  <Icon name="instagram" size={16} />
                </span>
                <div className="text-sm font-medium text-fg">Instagram</div>
              </div>
              <span className="shrink-0 rounded-full bg-surface2 px-2 py-0.5 text-[10px] font-medium text-muted">
                Próximamente
              </span>
            </div>
          )}

          {/* Chat del sitio web */}
          <div
            className={`flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 ${
              web?.allowed ? 'border border-line bg-surface2/40' : 'border border-dashed border-line opacity-70'
            }`}
          >
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-500/10 text-sky-600">
                <Icon name="globe" size={18} />
              </span>
              <div className="min-w-0">
                <div className="text-sm font-medium text-fg">Chat del sitio web</div>
                <div className="truncate text-xs text-subtle">
                  {!web?.allowed ? 'Disponible en Pro y Elite' : web.enabled ? 'Activo en tu sitio' : 'Sin activar'}
                </div>
              </div>
            </div>
            {web?.allowed && web.enabled ? (
              <Badge color="green">Activo</Badge>
            ) : web?.allowed ? (
              <Link
                to="/dashboard/conexiones?canal=web"
                className="shrink-0 text-xs font-semibold text-brand-600 hover:underline"
              >
                Activar
              </Link>
            ) : (
              <Link to="/dashboard/facturacion" className="shrink-0 text-xs font-semibold text-brand-600 hover:underline">
                Ver planes
              </Link>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}
