import { lazy, Suspense, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore.js';
import { useThemeStore } from './store/themeStore.js';
import { ProtectedRoute } from './router/ProtectedRoute.jsx';
import { Toaster } from './components/ui/Toaster.jsx';
import { Spinner } from './components/ui/index.jsx';

// La Landing va EAGER (es el LCP y la página más importante para SEO); el resto
// se carga bajo demanda (code-splitting) para aligerar el bundle inicial —
// especialmente el dashboard (recharts) y facturación (Stripe).
import Landing from './pages/public/Landing.jsx';

const named = (p, name) => lazy(() => p().then((m) => ({ default: m[name] })));

// Público
const Pricing = lazy(() => import('./pages/public/Pricing.jsx'));
const Blog = lazy(() => import('./pages/public/Blog.jsx'));
const BlogPost = lazy(() => import('./pages/public/BlogPost.jsx'));
const Solutions = lazy(() => import('./pages/public/Solutions.jsx'));
const Solution = lazy(() => import('./pages/public/Solution.jsx'));
const Status = lazy(() => import('./pages/public/Status.jsx'));
const Legal = lazy(() => import('./pages/public/Legal.jsx'));
const Login = lazy(() => import('./pages/public/Login.jsx'));
const Register = lazy(() => import('./pages/public/Register.jsx'));
const ForgotPassword = lazy(() => import('./pages/public/ForgotPassword.jsx'));
const AcceptInvitation = lazy(() => import('./pages/public/AcceptInvitation.jsx'));

// Onboarding
const OnboardingWizard = lazy(() => import('./pages/onboarding/OnboardingWizard.jsx'));

// Dashboard (privado)
const DashboardLayout = named(() => import('./components/layout/DashboardLayout.jsx'), 'DashboardLayout');
const Dashboard = lazy(() => import('./pages/dashboard/Dashboard.jsx'));
const BotTraining = lazy(() => import('./pages/dashboard/BotTraining.jsx'));
const Simulator = lazy(() => import('./pages/dashboard/Simulator.jsx'));
const Conversations = lazy(() => import('./pages/dashboard/Conversations.jsx'));
const Management = lazy(() => import('./pages/dashboard/Management.jsx'));
const Billing = lazy(() => import('./pages/dashboard/Billing.jsx'));
const Profile = lazy(() => import('./pages/dashboard/Profile.jsx'));
const Team = lazy(() => import('./pages/dashboard/Team.jsx'));
const AdminPanel = lazy(() => import('./pages/admin/AdminPanel.jsx'));

function RouteFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas">
      <Spinner className="text-brand-600" />
    </div>
  );
}

export default function App() {
  const bootstrap = useAuthStore((s) => s.bootstrap);
  const initTheme = useThemeStore((s) => s.init);

  // Al cargar la app: recupera sesión (cookie de refresh) e inicializa el tema.
  useEffect(() => {
    initTheme();
    bootstrap();
  }, [bootstrap, initTheme]);

  return (
    <>
    <Suspense fallback={<RouteFallback />}>
    <Routes>
      {/* Público */}
      <Route path="/" element={<Landing />} />
      <Route path="/precios" element={<Pricing />} />
      <Route path="/blog" element={<Blog />} />
      <Route path="/blog/:slug" element={<BlogPost />} />
      <Route path="/soluciones" element={<Solutions />} />
      <Route path="/soluciones/:slug" element={<Solution />} />
      <Route path="/status" element={<Status />} />
      <Route path="/privacidad" element={<Legal slug="privacidad" />} />
      <Route path="/terminos" element={<Legal slug="terminos" />} />
      <Route path="/login" element={<Login />} />
      <Route path="/registro" element={<Register />} />
      <Route path="/recuperar" element={<ForgotPassword />} />
      <Route path="/aceptar-invitacion" element={<AcceptInvitation />} />

      {/* Onboarding (requiere sesión, pero no negocio) */}
      <Route
        path="/onboarding"
        element={
          <ProtectedRoute>
            <OnboardingWizard />
          </ProtectedRoute>
        }
      />

      {/* Dashboard (requiere sesión + negocio) */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="entrenamiento" element={<BotTraining />} />
        <Route path="simulador" element={<Simulator />} />
        <Route path="conversaciones" element={<Conversations />} />
        <Route path="gestion" element={<Management />} />
        <Route path="facturacion" element={<Billing />} />
        <Route path="equipo" element={<Team />} />
        <Route path="perfil" element={<Profile />} />
        <Route
          path="admin"
          element={
            <ProtectedRoute role="admin">
              <AdminPanel />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </Suspense>
    <Toaster />
    </>
  );
}
