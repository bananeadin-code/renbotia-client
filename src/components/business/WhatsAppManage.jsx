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

// Accesos a Meta para lo que NO podemos hacer por API (para no dejar al usuario a la suerte).
const META_LINKS = [
  {
    label: 'Cambiar el nombre visible',
    desc: 'El nombre que ven tus clientes se cambia en el Administrador de WhatsApp y lo revisa Meta.',
    url: 'https://business.facebook.com/wa/manage/phone-numbers/',
  },
  {
    label: 'Método de pago y facturación',
    desc: 'Agrega o actualiza tu tarjeta en Meta para enviar plantillas y evitar cortes.',
    url: 'https://business.facebook.com/billing_hub/accounts',
  },
  {
    label: 'Administrar plantillas en Meta',
    desc: 'Revisa el estado (aprobada/rechazada) y edita tus plantillas.',
    url: 'https://business.facebook.com/wa/manage/message-templates/',
  },
  {
    label: 'Verificación del negocio',
    desc: 'Estado y datos de la verificación de tu empresa en Meta.',
    url: 'https://business.facebook.com/settings/security',
  },
];

// Convierte un archivo de imagen a un data URI CUADRADO (cover) y comprimido,
// como pide la foto de perfil de WhatsApp.
function fileToSquareDataUri(file, size = 640) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        const scale = Math.max(size / img.width, size / img.height);
        const w = img.width * scale;
        const h = img.height * scale;
        ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = reject;
      img.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

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
  const [photoUrl, setPhotoUrl] = useState('');
  const [newPhoto, setNewPhoto] = useState('');

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
      setPhotoUrl(pr.profile_picture_url || '');
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
      await connectionsApi.updateProfile({ ...profile, ...(newPhoto ? { photo: newPhoto } : {}) });
      if (newPhoto) {
        setPhotoUrl(newPhoto);
        setNewPhoto('');
      }
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
          {/* Foto de perfil */}
          <div className="flex items-center gap-4">
            <span className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border border-line bg-surface2 text-subtle">
              {newPhoto || photoUrl ? (
                <img src={newPhoto || photoUrl} alt="Foto de perfil" className="h-full w-full object-cover" />
              ) : (
                <Icon name="user" size={24} />
              )}
            </span>
            <div>
              {isOwner && (
                <label className="inline-block cursor-pointer rounded-lg border border-line px-3 py-1.5 text-sm font-medium text-fg transition hover:border-brand-300">
                  {newPhoto ? 'Cambiar otra' : 'Cambiar foto'}
                  <input
                    type="file"
                    accept="image/png,image/jpeg"
                    className="hidden"
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      try {
                        setNewPhoto(await fileToSquareDataUri(f));
                      } catch {
                        toast.error('No se pudo leer la imagen.');
                      }
                    }}
                  />
                </label>
              )}
              <p className="mt-1 text-xs text-subtle">Cuadrada, se recorta al centro. Se guarda al dar “Guardar perfil”.</p>
            </div>
          </div>

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

      {/* Gestionar en Meta: lo que no se puede hacer por API */}
      <Card>
        <h2 className="font-semibold text-fg">Gestionar en Meta</h2>
        <p className="mt-1 text-sm text-muted">
          Algunas cosas se administran directo en Meta. Aquí tienes los enlaces para realizar esos
          ajustes.
        </p>
        <div className="mt-4 space-y-2">
          {META_LINKS.map((l) => (
            <a
              key={l.url}
              href={l.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-3 rounded-lg border border-line bg-surface2/40 px-3 py-2.5 transition hover:border-brand-300"
            >
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-fg">{l.label}</span>
                <span className="block text-xs text-muted">{l.desc}</span>
              </span>
              <Icon name="link" size={16} className="mt-0.5 shrink-0 text-subtle" />
            </a>
          ))}
        </div>
      </Card>
    </>
  );
}
