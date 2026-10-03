import React from 'react';
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  DollarSign, 
  Trophy 
} from 'lucide-react';

export type NavTab = 'dashboard' | 'matches' | 'players' | 'finances' | 'stats';

interface BottomNavBarProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  accentColor?: string;
  hasPendingDebts?: boolean;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  currentTab,
  onTabChange,
  accentColor = '#10B981',
  hasPendingDebts = false,
}) => {
  const tabs = [
    { id: 'dashboard' as NavTab, label: 'Inicio', icon: LayoutDashboard },
    { id: 'matches' as NavTab, label: 'Partidos', icon: Calendar },
    { id: 'players' as NavTab, label: 'Plantel', icon: Users },
    { 
      id: 'finances' as NavTab, 
      label: 'Pagos', 
      icon: DollarSign,
      badge: hasPendingDebts 
    },
    { id: 'stats' as NavTab, label: 'Estadísticas', icon: Trophy },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-lg safe-bottom">
      <div className="max-w-md md:max-w-2xl mx-auto flex items-center justify-around h-16 px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className="flex-1 flex flex-col items-center justify-center py-1 transition-transform active:scale-95 group focus:outline-none"
            >
              <div
                className={`relative px-4 py-1 rounded-full transition-all duration-200 flex items-center justify-center ${
                  isActive ? 'bg-emerald-100 text-emerald-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
                style={isActive ? { backgroundColor: `${accentColor}25`, color: accentColor } : {}}
              >
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
                {tab.badge && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white animate-pulse" />
                )}
              </div>
              <span
                className={`text-[11px] mt-1 font-semibold tracking-tight transition-colors ${
                  isActive ? 'text-slate-900 font-bold' : 'text-slate-500'
                }`}
                style={isActive ? { color: accentColor } : {}}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
