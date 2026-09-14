import { useEffect, useState } from 'react';
import { connectionsApi } from '../../api/endpoints.js';
import { toast } from '../../store/toastStore.js';
import { Card, Button, Input, Select, Alert, Spinner } from '../ui/index.jsx';
import { Icon } from '../ui/Icon.jsx';

/**
 * Gestión del WhatsApp conectado, dentro de Conexiones:
 *  - Perfil de WhatsApp Business (lo que el cliente ve en el chat).
 *  - Plantillas de mensaje (crear/enviar a revisión de Meta) para reactivar
 *    conversaciones fuera de la ventana de 24 h.
 * Ver: cualquier miembro. Editar/crear: solo el dueño (isOwner).
 */

const TEMPLATE_PRESETS = [
  {
    label: 'Reactivación',
    name: 'reactivacion',
    category: 'MARKETING',
    bodyText:
      'Hola, seguimos disponibles para ayudarte. ¿Te gustaría retomar tu consulta? Con gusto te atendemos por aquí.',
  },
  {
    label: 'Seguimiento',
    name: 'seguimiento',
    category: 'UTILITY',
    bodyText:
      'Hola, damos seguimiento a tu solicitud. Si necesitas algo más, respóndenos por este medio y te ayudamos.',
  },
];

const STATUS_STYLE = {
  APPROVED: 'bg-emerald-500/10 text-emerald-600',
  PENDING: 'bg-amber-500/15 text-amber-600',
  REJECTED: 'bg-red-500/10 text-red-500',
};
const STATUS_LABEL = { APPROVED: 'Aprobada', PENDING: 'En revisión', REJECTED: 'Rechazada' };

export function WhatsAppManage({ isOwner }) {
  const [loading, setLoading] = useState(true);
  const [verticals, setVerticals] = useState([]);
  const [profile, setProfile] = useState({
    about: '',
    description: '',
    email: '',
    website: '',
    address: '',
    vertical: '',
  });
  const [savingProfile, setSavingProfile] = useState(false);

  const [templates, setTemplates] = useState([]);
  const [tplReason, setTplReason] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [tpl, setTpl] = useState({ name: '', category: 'UTILITY', bodyText: '' });
  const [creatingTpl, setCreatingTpl] = useState(false);

  async function load() {
    try {
      const [p, t] = await Promise.all([connectionsApi.getProfile(), connectionsApi.listTemplates()]);
      setVerticals(p.verticals || []);
      const pr = p.profile || {};
      setProfile({
        about: pr.about || '',
        description: pr.description || '',
        email: pr.email || '',
        website: (pr.websites && pr.websites[0]) || '',
        address: pr.address || '',
        vertical: pr.vertical || '',
      });
      setTemplates(t.templates || []);
      setTplReason(t.reason || null);
    } catch {
      /* silencioso */
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
  }, []);

  async function saveProfile(e) {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await connectionsApi.updateProfile(profile);
      toast.success('Perfil de WhatsApp actualizado.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'No se pudo actualizar el perfil.');
    } finally {
      setSavingProfile(false);
    }
  }

  async function createTpl(e) {
    e.preventDefault();
    setCreatingTpl(true);
    try {
      await connectionsApi.createTemplate({ ...tpl, language: 'es_MX' });
      toast.success('Plantilla enviada a revisión de Meta. Aparecerá aprobada en unos minutos u horas.');
      setShowCreate(false);
      setTpl({ name: '', category: 'UTILITY', bodyText: '' });
      const t = await connectionsApi.listTemplates();
      setTemplates(t.templates || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'No se pudo crear la plantilla.');
    } finally {
      setCreatingTpl(false);
    }
  }

  if (loading) {
    return (
      <Card className="flex justify-center py-8">
        <Spinner className="text-brand-600" />
      </Card>
    );
  }

  return (
    <>
      {/* Perfil de WhatsApp Business */}
      <Card>
        <h2 className="font-semibold text-fg">Perfil de WhatsApp</h2>
        <p className="mt-1 text-sm text-muted">
          Lo que tus clientes ven en el chat: descripción, categoría, sitio y correo.
        </p>
        <div className="mt-3 flex items-start gap-1.5 rounded-lg border border-line bg-surface2/50 p-3 text-xs text-subtle">
          <Icon name="shield" size={14} className="mt-0.5 shrink-0" />
          <span>
            El <strong className="text-fg">nombre visible</strong> de tu WhatsApp se define al registrar el
            número y cambiarlo requiere revisión de Meta. Aquí editas el resto del perfil.
          </span>
        </div>

        <form onSubmit={saveProfile} className="mt-4 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-fg">Info (frase corta)</label>
            <input
              maxLength={139}
              value={profile.about}
              onChange={(e) => setProfile({ ...profile, about: e.target.value })}
              placeholder="Ej. Asesoría legal para PyMES"
              disabled={!isOwner}
              className="w-full rounded-lg border border-line bg-canvas px-3 py-2 text-sm text-fg outline-none focus:border-brand-500 disabled:opacity-60"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-fg">Descripción</label>
            <textarea
              rows={3}
              maxLength={512}
              value={profile.description}
              onChange={(e) => setProfile({ ...profile, description: e.target.value })}
              placeholder="Describe tu negocio y lo que ofreces."
              disabled={!isOwner}
              className="w-full rounded-lg border border-line bg-canvas px-3 py-2 text-sm text-fg outline-none focus:border-brand-500 disabled:opacity-60"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Sitio web"
              type="url"
              placeholder="https://tudominio.com"
              value={profile.website}
              onChange={(e) => setProfile({ ...profile, website: e.target.value })}
              disabled={!isOwner}
            />
            <Input
              label="Correo"
              type="email"
              placeholder="contacto@tudominio.com"
              value={profile.email}
              onChange={(e) => setProfile({ ...profile, email: e.target.value })}
              disabled={!isOwner}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Dirección"
              placeholder="Calle, ciudad"
              value={profile.address}
              onChange={(e) => setProfile({ ...profile, address: e.target.value })}
              disabled={!isOwner}
            />
            <Select
              label="Categoría"
              value={profile.vertical}
              onChange={(e) => setProfile({ ...profile, vertical: e.target.value })}
              disabled={!isOwner}
            >
              <option value="">Selecciona…</option>
              {verticals.map((v) => (
                <option key={v.value} value={v.value}>
                  {v.label}
                </option>
              ))}
            </Select>
          </div>
          {isOwner && (
            <div className="flex justify-end">
              <Button type="submit" disabled={savingProfile}>
                {savingProfile ? 'Guardando…' : 'Guardar perfil'}
              </Button>
            </div>
          )}
        </form>
      </Card>

      {/* Plantillas */}
      <Card>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-semibold text-fg">Plantillas de mensaje</h2>
            <p className="mt-1 text-sm text-muted">
              Sirven para escribirle a un cliente cuando pasaron 24 h desde su último mensaje. Meta las
              revisa antes de aprobarlas.
            </p>
          </div>
          {isOwner && !showCreate && (
            <Button size="sm" variant="secondary" className="shrink-0" onClick={() => setShowCreate(true)}>
              <Icon name="plus" size={15} /> Nueva
            </Button>
          )}
        </div>

        <div className="mt-4 space-y-2">
          {templates.length === 0 ? (
            <Alert variant="info">
              {tplReason === 'no_waba'
                ? 'Conecta tu WhatsApp para gestionar plantillas.'
                : 'Aún no tienes plantillas. Crea una para reactivar conversaciones fuera de la ventana de 24 h.'}
            </Alert>
          ) : (
            templates.map((t) => (
              <div
                key={`${t.name}-${t.language}`}
                className="flex items-center justify-between gap-2 rounded-lg border border-line bg-surface2/40 px-3 py-2"
              >
                <span className="min-w-0 truncate text-sm font-medium text-fg">
                  {t.name} <span className="text-subtle">({t.language})</span>
                </span>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    STATUS_STYLE[t.status] || 'bg-surface2 text-muted'
                  }`}
                >
                  {STATUS_LABEL[t.status] || t.status}
                </span>
              </div>
            ))
          )}
        </div>

        {isOwner && showCreate && (
          <form onSubmit={createTpl} className="mt-4 space-y-3 rounded-xl border border-line bg-surface2/40 p-4">
            <div className="flex flex-wrap gap-2">
              <span className="text-xs text-subtle">Sugeridas:</span>
              {TEMPLATE_PRESETS.map((p) => (
                <button
                  type="button"
                  key={p.name}
                  onClick={() => setTpl({ name: p.name, category: p.category, bodyText: p.bodyText })}
                  className="rounded-full border border-line px-3 py-1 text-xs font-medium text-muted hover:border-brand-300 hover:text-fg"
                >
                  {p.label}
                </button>
              ))}
            </div>
            <Input
              label="Nombre (sin espacios)"
              value={tpl.name}
              onChange={(e) => setTpl({ ...tpl, name: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_') })}
              placeholder="reactivacion"
            />
            <Select label="Categoría" value={tpl.category} onChange={(e) => setTpl({ ...tpl, category: e.target.value })}>
              <option value="UTILITY">Utilidad (seguimiento, avisos)</option>
              <option value="MARKETING">Marketing (promociones)</option>
            </Select>
            <div>
              <label className="mb-1 block text-sm font-medium text-fg">Mensaje</label>
              <textarea
                rows={3}
                maxLength={1024}
                value={tpl.bodyText}
                onChange={(e) => setTpl({ ...tpl, bodyText: e.target.value })}
                placeholder="Texto de la plantilla (sin variables)."
                required
                className="w-full rounded-lg border border-line bg-canvas px-3 py-2 text-sm text-fg outline-none focus:border-brand-500"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setShowCreate(false)}>
                Cancelar
              </Button>
              <Button type="submit" size="sm" disabled={creatingTpl || !tpl.name || !tpl.bodyText.trim()}>
                {creatingTpl ? 'Enviando…' : 'Enviar a revisión'}
              </Button>
            </div>
          </form>
        )}
      </Card>
    </>
  );
}
