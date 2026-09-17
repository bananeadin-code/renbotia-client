import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { connectionsApi } from '../../api/endpoints.js';
import { Card, Badge, Spinner } from '../ui/index.jsx';
import { Icon } from '../ui/Icon.jsx';

/**
 * Panel informativo de canales conectados (solo datos). La conexión real se
 * gestiona en Conexiones; aquí se muestra el número de WhatsApp asociado al bot
 * y, a futuro, los datos de Instagram y Facebook Messenger.
 */
export function ConnectedChannels() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    connectionsApi
      .get()
      .then(setData)
      .catch(() => setData(null))
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

          {/* Instagram y Messenger — próximamente */}
          <div className="flex items-center justify-between gap-3 rounded-lg border border-dashed border-line px-3 py-2.5 opacity-70">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center gap-1 rounded-lg bg-surface2 text-subtle">
                <Icon name="instagram" size={15} />
                <Icon name="messenger" size={15} />
              </span>
              <div className="text-sm font-medium text-fg">Instagram y Messenger</div>
            </div>
            <span className="shrink-0 rounded-full bg-surface2 px-2 py-0.5 text-[10px] font-medium text-muted">
              Próximamente
            </span>
          </div>
        </div>
      )}
    </Card>
  );
}
