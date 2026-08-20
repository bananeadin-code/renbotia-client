import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { membersApi } from '../../api/endpoints.js';
import { toast } from '../../store/toastStore.js';
import { useBusinessStore } from '../../store/businessStore.js';
import { limitsFor } from '../../lib/planLimits.js';
import { Card, Button, Input, Badge, Alert, Spinner } from '../../components/ui/index.jsx';
import { Icon } from '../../components/ui/Icon.jsx';

/**
 * Equipo: miembros del negocio (dueño + colaboradores). El dueño invita por
 * correo y gestiona; los colaboradores ven la lista. Multiusuario: varias
 * personas configuran el mismo bot sin compartir contraseña.
 */
export default function Team() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState('');
  const [devLink, setDevLink] = useState('');

  async function load() {
    try {
      setData(await membersApi.list());
    } catch (e) {
      setError(e.response?.data?.message || 'No se pudo cargar el equipo.');
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
  }, []);

  const subscription = useBusinessStore((s) => s.subscription);
  const canInvite = limitsFor(subscription?.plan?.key).multiUser;
  const isOwner = data?.myRole === 'owner';

  async function invite(e) {
    e.preventDefault();
    setError('');
    setDevLink('');
    setInviting(true);
    try {
      const res = await membersApi.invite(email.trim());
      toast.success('Invitación enviada.');
      setEmail('');
      if (res.devLink) setDevLink(res.devLink);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo invitar.');
    } finally {
      setInviting(false);
    }
  }

  async function removeMember(m) {
    if (!window.confirm(`¿Quitar a ${m.name || m.email} del negocio?`)) return;
    try {
      await membersApi.remove(m.userId);
      toast.success('Colaborador removido.');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'No se pudo quitar.');
    }
  }

  async function cancelInvite(inv) {
    try {
      await membersApi.cancelInvite(inv.id);
      toast.success('Invitación cancelada.');
      load();
    } catch {
      toast.error('No se pudo cancelar.');
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner className="text-brand-600" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-fg">Equipo</h1>
        <p className="text-sm text-muted">
          Invita a otras personas a configurar el bot contigo, sin compartir tu contraseña.
        </p>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      {/* Invitar (solo dueño y en planes Pro/Elite) */}
      {isOwner && !canInvite ? (
        <Card className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-600">
            <Icon name="users" size={26} />
          </div>
          <h2 className="mt-3 font-bold text-fg">Colaboradores en Pro y Elite</h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted">
            Invita a tu equipo a configurar el bot contigo. Disponible al mejorar tu plan.
          </p>
          <Link to="/dashboard/facturacion" className="mt-4 inline-block">
            <Button>
              <Icon name="sparkles" size={16} /> Mejorar mi plan
            </Button>
          </Link>
        </Card>
      ) : isOwner ? (
        <Card>
          <h2 className="mb-1 font-semibold text-fg">Invitar colaborador</h2>
          <p className="mb-4 text-sm text-muted">
            Podrá entrenar el bot, usar el simulador y la gestión — pero no la facturación.
          </p>
          <form onSubmit={invite} className="flex flex-col gap-2 sm:flex-row">
            <Input
              type="email"
              required
              placeholder="correo@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" disabled={inviting || !email.trim()}>
              {inviting ? 'Enviando…' : 'Invitar'}
            </Button>
          </form>
          {devLink && (
            <Alert variant="info">
              <span className="text-sm">Modo prueba — comparte este enlace para aceptar:</span>
              <code className="mt-1 block break-all rounded bg-surface2 px-2 py-1 text-xs">{devLink}</code>
            </Alert>
          )}
        </Card>
      ) : (
        <Alert variant="info">Solo el dueño del negocio puede gestionar el equipo.</Alert>
      )}

      {/* Miembros */}
      <Card>
        <h2 className="mb-3 font-semibold text-fg">Miembros</h2>
        <ul className="divide-y divide-line">
          {data.members.map((m) => (
            <li key={m.userId} className="flex items-center gap-3 py-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-500/15 text-sm font-bold text-brand-700 dark:text-brand-300">
                {(m.name || m.email).charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-fg">
                  {m.name || m.email} {m.isMe && <span className="text-xs text-subtle">(tú)</span>}
                </div>
                <div className="truncate text-xs text-subtle">{m.email}</div>
              </div>
              <Badge color={m.role === 'owner' ? 'green' : 'slate'}>
                {m.role === 'owner' ? 'Dueño' : 'Colaborador'}
              </Badge>
              {isOwner && m.role !== 'owner' && (
                <button
                  onClick={() => removeMember(m)}
                  className="rounded-lg p-1.5 text-muted hover:bg-red-500/10 hover:text-red-500"
                  aria-label="Quitar"
                >
                  <Icon name="trash" size={16} />
                </button>
              )}
            </li>
          ))}
        </ul>
      </Card>

      {/* Invitaciones pendientes */}
      {data.invitations.length > 0 && (
        <Card>
          <h2 className="mb-3 font-semibold text-fg">Invitaciones pendientes</h2>
          <ul className="divide-y divide-line">
            {data.invitations.map((inv) => (
              <li key={inv.id} className="flex items-center gap-3 py-3">
                <Icon name="message" size={18} className="shrink-0 text-subtle" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm text-fg">{inv.email}</div>
                  <div className="text-xs text-subtle">Pendiente de aceptar</div>
                </div>
                {isOwner && (
                  <Button variant="ghost" size="sm" onClick={() => cancelInvite(inv)}>
                    Cancelar
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
