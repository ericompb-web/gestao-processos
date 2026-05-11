
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Briefcase, FileText, CheckSquare, Calculator, ChevronLeft, ChevronRight } from 'lucide-react';

export function Layout() {
  const navigate = useNavigate();
  const navItems = [
    { to: '/', label: 'Judiciais', icon: Briefcase },
    { to: '/administrativos', label: 'Administrativos', icon: FileText },
    { to: '/tarefas', label: 'Tarefas', icon: CheckSquare },
    { to: '/calculadora', label: 'Calculadora', icon: Calculator },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-brand-500 selection:text-white flex flex-col md:flex-row">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 sticky top-0 h-screen overflow-y-auto shadow-sm z-40">
        <div className="p-6">
          <div className="flex items-center gap-1 mb-4">
            <button onClick={() => navigate(-1)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition-colors" title="Voltar">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button onClick={() => navigate(1)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition-colors" title="Avançar">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          <div className="flex items-center gap-3 text-brand-700">
            <div className="bg-brand-100 p-2 rounded-lg">
              <Briefcase className="w-6 h-6 text-brand-600" />
            </div>
            <h1 className="font-bold text-xl tracking-tight leading-tight">Gestão de Processos</h1>
          </div>
        </div>
        
        <nav className="flex-1 px-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors ${
                  isActive
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm flex items-center justify-between px-2">
        <div className="flex items-center">
          <button onClick={() => navigate(-1)} className="p-2 text-slate-500 hover:text-slate-800 transition-colors" title="Voltar">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button onClick={() => navigate(1)} className="p-2 text-slate-500 hover:text-slate-800 transition-colors" title="Avançar">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        <div className="h-16 flex items-center gap-2 text-brand-700 pr-2">
          <div className="bg-brand-100 p-1.5 rounded-lg">
            <Briefcase className="w-4 h-4 text-brand-600" />
          </div>
          <h1 className="font-bold text-base tracking-tight">Gestão</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 md:px-8 py-6 pb-24 md:pb-8">
        <Outlet />
      </main>

      {/* Mobile Bottom Bar */}
      <nav className="md:hidden fixed bottom-0 w-full bg-white border-t border-slate-200 z-50 pb-safe">
        <div className="flex justify-around items-center h-16 px-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center w-full h-full space-y-1 ${
                  isActive ? 'text-brand-700' : 'text-slate-500 hover:text-slate-900'
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
