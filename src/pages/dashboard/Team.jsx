import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { membersApi } from '../../api/endpoints.js';
import { toast } from '../../store/toastStore.js';
import { confirm } from '../../store/confirmStore.js';
import { useBusinessStore } from '../../store/businessStore.js';
import { limitsFor } from '../../lib/planLimits.js';
import { Card, Button, Input, Badge, Alert, Spinner } from '../../components/ui/index.jsx';
import { Icon } from '../../components/ui/Icon.jsx';
import { TeamSecurityCard, MemberSessions } from '../../components/team/TeamSecurity.jsx';
import { RoleSelect, AccessSummary, AccessEditor, CustomRolesCard } from '../../components/team/Roles.jsx';

/**
 * Equipo: miembros del negocio (dueño + colaboradores). El dueño invita por
 * correo con un rol (IAM: módulos × nivel y canales); un Administrador también
 * gestiona; el resto solo ve la lista. Multiusuario: varias
 * personas configuran el mismo bot sin compartir contraseña.
 */
// Texto de vigencia de una invitación (vencen a los 7 días de enviarse).
function expiryLabel(expiresAt) {
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (!expiresAt || Number.isNaN(ms)) return { text: 'Pendiente de aceptar', soon: false, expired: false };
  if (ms <= 0) return { text: 'Venció · reenvíala para darle 7 días más', soon: true, expired: true };
  const hours = Math.ceil(ms / 3600000);
  if (hours < 24) return { text: `Vence en ${hours} ${hours === 1 ? 'hora' : 'horas'}`, soon: true, expired: false };
  const days = Math.ceil(ms / 86400000);
  return { text: `Vence en ${days} ${days === 1 ? 'día' : 'días'}`, soon: days <= 2, expired: false };
}

export default function Team() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState('');
  const [devLink, setDevLink] = useState('');
  const [resending, setResending] = useState(''); // id de la invitación que se reenvía
  const [inviteRole, setInviteRole] = useState('agent');
  const [customFor, setCustomFor] = useState(null); // miembro cuyo acceso se edita a mano
  const [savingRole, setSavingRole] = useState(false);

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
  // Gestionar el equipo: el dueño o quien tenga "Equipo: editar" (p. ej. Administrador).
  const canManage = Boolean(data?.canManageTeam);

  async function invite(e) {
    e.preventDefault();
    setError('');
    setDevLink('');
    setInviting(true);
    try {
      const res = await membersApi.invite(email.trim(), inviteRole === 'custom' ? 'agent' : inviteRole);
      toast.success(
        res.registered
          ? 'Invitación enviada. La persona ya tiene cuenta y abrirá el enlace para unirse.'
          : 'Invitación enviada. La persona debe crear una cuenta con ese correo y abrir el enlace.'
      );
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
    if (
      !(await confirm({
        title: 'Quitar colaborador',
        message: `¿Quitar a ${m.name || m.email} del negocio? Perderá el acceso a este proyecto.`,
        tone: 'danger',
        confirmLabel: 'Quitar',
      }))
    )
      return;
    try {
      await membersApi.remove(m.userId);
      toast.success('Colaborador removido.');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'No se pudo quitar.');
    }
  }

  // Reenviar = invitar de nuevo al mismo correo: nuevo enlace con 7 días más (el
  // anterior deja de servir).
  async function resendInvite(inv) {
    setResending(inv.id);
    setDevLink('');
    try {
      const res = await membersApi.invite(inv.email, inv.roleKey);
      toast.success(`Invitación reenviada a ${inv.email}. Vence en 7 días.`);
      if (res.devLink) setDevLink(res.devLink);
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'No se pudo reenviar.');
    } finally {
      setResending('');
    }
  }

  async function changeRole(m, roleKey, access) {
    if (roleKey === 'custom' && !access) {
      setCustomFor(m);
      return;
    }
    setSavingRole(true);
    try {
      await membersApi.setRole(m.userId, roleKey === 'custom' ? { roleKey, access } : { roleKey });
      toast.success('Rol actualizado.');
      setCustomFor(null);
      await load();
    } catch (err) {
      if (err.message !== 'cancelled') toast.error(err.response?.data?.message || 'No se pudo cambiar el rol.');
    } finally {
      setSavingRole(false);
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
      ) : canManage ? (
        <Card>
          <h2 className="mb-1 font-semibold text-fg">Invitar colaborador</h2>
          <p className="mb-4 text-sm text-muted">
            Elige con qué rol entra. Puedes cambiarlo cuando quieras; nadie del equipo ve la facturación.
          </p>
          <form onSubmit={invite} className="flex flex-col gap-2 sm:flex-row">
            <RoleSelect value={inviteRole} roles={data.roles} onChange={setInviteRole} includeCustom={false} />
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
        <Alert variant="info">Tu rol te deja ver al equipo, pero no gestionarlo.</Alert>
      )}

      {/* Miembros */}
      <Card>
        <h2 className="mb-3 font-semibold text-fg">Miembros</h2>
        <ul className="divide-y divide-line">
          {data.members.map((m) => (
            <li key={m.userId} className="py-3">
              <div className="flex items-center gap-3">
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
              {canManage && m.role !== 'owner' && !m.isMe && (
                <button
                  onClick={() => removeMember(m)}
                  className="rounded-lg p-1.5 text-muted hover:bg-red-500/10 hover:text-red-500"
                  aria-label="Quitar"
                >
                  <Icon name="trash" size={16} />
                </button>
              )}
              </div>
              {m.role !== 'owner' && (
                <div className="mt-2 space-y-2 pl-12">
                  <div className="flex flex-wrap items-center gap-2">
                    {canManage && !m.isMe ? (
                      <RoleSelect
                        value={m.access?.roleKey || 'custom'}
                        roles={data.roles}
                        disabled={savingRole}
                        onChange={(k) => changeRole(m, k)}
                      />
                    ) : (
                      <span className="rounded-full bg-surface2 px-2.5 py-1 text-xs font-medium text-fg">
                        {m.access?.roleName || 'Colaborador'}
                      </span>
                    )}
                    {canManage && !m.isMe && m.access?.roleKey === 'custom' && (
                      <button type="button" onClick={() => setCustomFor(m)} className="text-xs font-medium text-brand-600 hover:underline">
                        Ajustar acceso
                      </button>
                    )}
                  </div>
                  <AccessSummary access={m.access} />
                  {canManage && <MemberSessions member={m} />}
                  {m.simulator?.tokens > 0 && (
                    <p className="mt-1.5 text-xs text-subtle">
                      Simulador este mes: {m.simulator.tokens.toLocaleString('es-MX')} tokens en {m.simulator.messages}{' '}
                      {m.simulator.messages === 1 ? 'mensaje' : 'mensajes'}
                    </p>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      </Card>

      {/* Roles (solo el dueño los define) */}
      {isOwner && <CustomRolesCard catalog={data.roles} onChanged={load} />}

      <AccessEditor
        open={Boolean(customFor)}
        onClose={() => setCustomFor(null)}
        title={`Acceso de ${customFor?.name || customFor?.email || ''}`}
        initial={customFor?.access}
        catalog={data?.roles}
        saving={savingRole}
        onSave={(v) => changeRole(customFor, 'custom', { modules: v.modules, channels: v.channels })}
      />

      {/* Seguridad del equipo (solo dueño) */}
      {isOwner && (
        <TeamSecurityCard
          requireTeam2fa={Boolean(data.security?.requireTeam2fa)}
          onChange={(v) => setData((d) => ({ ...d, security: { ...(d.security || {}), requireTeam2fa: v } }))}
        />
      )}

      {/* Invitaciones pendientes */}
      {data.invitations.length > 0 && (
        <Card>
          <h2 className="font-semibold text-fg">Invitaciones pendientes</h2>
          <p className="mb-3 text-xs text-muted">
            Cada invitación vale 7 días. Si la persona no la abrió a tiempo, reenvíala: llega un enlace nuevo.
          </p>
          <ul className="divide-y divide-line">
            {data.invitations.map((inv) => {
              const exp = expiryLabel(inv.expiresAt);
              return (
                <li key={inv.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 py-3">
                  <Icon name="message" size={18} className="shrink-0 text-subtle" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm text-fg">
                      {inv.email}
                      {inv.roleName && <span className="ml-2 text-xs text-subtle">· {inv.roleName}</span>}
                    </div>
                    <div
                      className={`flex items-center gap-1 text-xs ${
                        exp.expired ? 'text-red-500' : exp.soon ? 'text-amber-600' : 'text-subtle'
                      }`}
                    >
                      <Icon name="clock" size={12} className="shrink-0" />
                      {exp.text}
                    </div>
                  </div>
                  {canManage && (
                    <div className="flex shrink-0 items-center gap-1">
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={Boolean(resending)}
                        onClick={() => resendInvite(inv)}
                      >
                        <Icon name="refresh" size={14} />
                        {resending === inv.id ? 'Reenviando…' : 'Reenviar'}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => cancelInvite(inv)}>
                        Cancelar
                      </Button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </Card>
      )}
    </div>
  );
}
