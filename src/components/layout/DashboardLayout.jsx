import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore.js';
import { useBusinessStore } from '../../store/businessStore.js';
import { Spinner } from '../ui/index.jsx';
import { Icon } from '../ui/Icon.jsx';
import { Logo } from '../ui/Logo.jsx';
import { ThemeToggle } from '../ui/ThemeToggle.jsx';
import { ProjectSwitcher } from './ProjectSwitcher.jsx';

const NAV = [
  { to: '/dashboard', label: 'Inicio', end: true, icon: 'home' },
  { to: '/dashboard/entrenamiento', label: 'Entrenamiento', icon: 'academic' },
  { to: '/dashboard/simulador', label: 'Simulador', icon: 'message' },
  { to: '/dashboard/conversaciones', label: 'Conversaciones', icon: 'inbox' },
  // Gestión se inserta aquí solo para Elite (ver más abajo).
  { to: '/dashboard/facturacion', label: 'Facturación', icon: 'card' },
  { to: '/dashboard/equipo', label: 'Equipo', icon: 'users' },
  { to: '/dashboard/perfil', label: 'Perfil', icon: 'user' },
];

/**
 * Layout privado. Carga el negocio del usuario; si no tiene, redirige al
 * onboarding. Sidebar fijo en desktop, drawer en móvil.
 */
export function DashboardLayout() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { hasBusiness, business, subscription, role, load } = useBusinessStore();
  const [checking, setChecking] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    load()
      .then((ok) => {
        if (!ok) navigate('/onboarding', { replace: true });
      })
      .catch(() => {})
      .finally(() => setChecking(false));
  }, [load, navigate]);

  // Gestión: solo plan Elite. Se inserta tras "Simulador".
  const isElite = subscription?.plan?.key === 'elite';
  let nav = NAV;
  if (isElite) {
    const i = NAV.findIndex((n) => n.to === '/dashboard/simulador');
    nav = [...NAV.slice(0, i + 1), { to: '/dashboard/gestion', label: 'Gestión de trabajo', icon: 'calendarCheck' }, ...NAV.slice(i + 1)];
  }
  // Los colaboradores no ven Facturación (es solo del dueño).
  if (role === 'colaborador') nav = nav.filter((n) => n.to !== '/dashboard/facturacion');
  if (user?.role === 'admin')
    nav = [
      ...nav,
      { to: '/dashboard/asistente-sitio', label: 'Asistente del sitio', icon: 'message' },
      { to: '/dashboard/admin', label: 'Admin', icon: 'shield' },
    ];

  async function handleLogout() {
    await logout();
    useBusinessStore.getState().reset();
    navigate('/login', { replace: true });
  }

  if (checking || hasBusiness === null) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="text-brand-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas">
      {/* Topbar (móvil) */}
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-line bg-surface px-4 py-3 md:hidden">
        <button
          onClick={() => setMenuOpen(true)}
          className="rounded-lg p-1 text-fg hover:bg-surface2"
          aria-label="Abrir menú"
        >
          <Icon name="menu" size={24} />
        </button>
        <Logo size={26} />
        <ThemeToggle />
      </header>

      <div className="flex">
        {/* Sidebar / Drawer */}
        {menuOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/40 md:hidden"
            onClick={() => setMenuOpen(false)}
          />
        )}
        <aside
          className={`fixed z-40 h-full w-64 transform overflow-y-auto border-r border-line bg-surface p-4 transition-transform md:sticky md:top-0 md:z-0 md:h-screen md:translate-x-0 ${
            menuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="mb-6 flex items-center justify-between">
            <Logo size={28} />
            <button
              className="rounded-lg p-1 text-muted hover:bg-surface2 md:hidden"
              onClick={() => setMenuOpen(false)}
              aria-label="Cerrar menú"
            >
              <Icon name="close" size={20} />
            </button>
          </div>

          <div className="mb-4 flex items-center gap-3 rounded-lg border border-line bg-surface2 px-3 py-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-500/15 text-sm font-bold text-brand-700 dark:text-brand-300">
              {business?.name?.charAt(0).toUpperCase() || 'N'}
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-fg">{business?.name}</div>
              <div className="truncate text-xs text-subtle">{user?.email}</div>
            </div>
          </div>

          {/* Switcher de proyecto (solo si el usuario tiene más de uno). */}
          <ProjectSwitcher />

          <nav className="space-y-1">
            {nav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                    isActive
                      ? 'bg-brand-500/10 text-brand-700 dark:text-brand-300'
                      : 'text-muted hover:bg-surface2 hover:text-fg'
                  }`
                }
              >
                <Icon name={item.icon} size={18} />
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="mt-6 space-y-1 border-t border-line pt-4">
            <div className="flex items-center justify-between rounded-lg px-3 py-1.5">
              <span className="text-sm font-medium text-muted">Tema</span>
              <ThemeToggle />
            </div>
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted hover:bg-red-500/10 hover:text-red-500"
            >
              <Icon name="logout" size={18} /> Cerrar sesión
            </button>
          </div>
        </aside>

        {/* Contenido: el sidebar queda pegado al borde; solo el módulo se
            centra y se limita en ancho (evita que la barra se "desprenda"
            en pantallas anchas o al alejar el zoom). */}
        <main className="min-h-screen min-w-0 flex-1 p-4 md:p-8">
          <div className="mx-auto max-w-6xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
