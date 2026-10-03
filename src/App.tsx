import React, { useState, useEffect } from 'react';
import { useStorage } from './hooks/useStorage';
import { NavTab, BottomNavBar } from './components/BottomNavBar';
import { TopAppBar } from './components/TopAppBar';
import { TeamSelectorModal } from './components/TeamSelectorModal';
import { RoleSelectorModal } from './components/RoleSelectorModal';
import { BackupModal } from './components/BackupModal';
import { DashboardView } from './components/dashboard/DashboardView';
import { MatchesView } from './components/matches/MatchesView';
import { PlayerList } from './components/players/PlayerList';
import { FinanceView } from './components/finances/FinanceView';
import { StatsView } from './components/stats/StatsView';
import { PlayerPortalView } from './components/playerMode/PlayerPortalView';
import { ConvocatoriaModal } from './components/matches/ConvocatoriaModal';
import { ScoreEditModal } from './components/matches/ScoreEditModal';
import { MatchDetailsModal } from './components/matches/MatchDetailsModal';
import { NewMatchModal } from './components/matches/NewMatchModal';
import { PlayerFormModal } from './components/players/PlayerFormModal';
import { PlayerDetailModal } from './components/players/PlayerDetailModal';
import { DirectInstallModal } from './components/pwa/DirectInstallModal';
import { ConfirmationDashboardModal } from './components/matches/ConfirmationDashboardModal';
import { MatchdayGraphicModal } from './components/matches/MatchdayGraphicModal';
import { PublicConfirmationView } from './components/public/PublicConfirmationView';
import { Match, Player } from './types';
import { WifiOff, Smartphone, Sparkles, User, Award, ShieldAlert, Download } from 'lucide-react';
import { cloudSync } from './services/cloudSync';

export default function App() {
  const { storage, activeTeam, userRole } = useStorage();

  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [isMobileFrame, setIsMobileFrame] = useState(false);

  // Public Confirmation Routing (supports #/confirmar/:matchId or /confirmar/:matchId)
  const extractConfirmationMatchId = () => {
    if (typeof window === 'undefined') return null;
    const hash = window.location.hash;
    if (hash.startsWith('#/confirmar/')) {
      return hash.replace('#/confirmar/', '').split('?')[0];
    }
    const pathMatch = window.location.pathname.match(/\/confirmar\/([^/?#]+)/);
    if (pathMatch) {
      return pathMatch[1];
    }
    return null;
  };

  const [publicMatchId, setPublicMatchId] = useState<string | null>(extractConfirmationMatchId);

  useEffect(() => {
    // Initialize Cloud Firestore synchronization
    cloudSync.init();

    const handleUrlChange = () => {
      setPublicMatchId(extractConfirmationMatchId());
    };
    window.addEventListener('hashchange', handleUrlChange);
    window.addEventListener('popstate', handleUrlChange);
    return () => {
      window.removeEventListener('hashchange', handleUrlChange);
      window.removeEventListener('popstate', handleUrlChange);
    };
  }, []);

  // Global Modals
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);

  // Match Modals
  const [activeMatchForCallup, setActiveMatchForCallup] = useState<Match | null>(null);
  const [activeMatchForScore, setActiveMatchForScore] = useState<Match | null>(null);
  const [activeMatchForDetails, setActiveMatchForDetails] = useState<Match | null>(null);
  const [activeMatchForConfirmations, setActiveMatchForConfirmations] = useState<Match | null>(null);
  const [activeMatchForGraphic, setActiveMatchForGraphic] = useState<Match | null>(null);
  const [matchDetailsTab, setMatchDetailsTab] = useState<'substitutions' | 'stats'>('substitutions');
  const [showNewMatchModal, setShowNewMatchModal] = useState(false);
  const [matchToEdit, setMatchToEdit] = useState<Match | null>(null);

  // Player Modals
  const [selectedPlayerForDetail, setSelectedPlayerForDetail] = useState<Player | null>(null);
  const [showNewPlayerModal, setShowNewPlayerModal] = useState(false);
  const [playerToEdit, setPlayerToEdit] = useState<Player | null>(null);

  // Financial quick trigger
  const [playerForDirectPayment, setPlayerForDirectPayment] = useState<Player | null>(null);

  // Check pending debts to highlight financial tab badge
  const financialOverview = storage.getTeamFinancialOverview(activeTeam?.id);
  const hasPendingDebts = financialOverview.debtors.length > 0;

  // If user opens public confirmation URL directly, render standalone public confirmation screen
  if (publicMatchId) {
    return (
      <PublicConfirmationView
        matchId={publicMatchId}
        onNavigateHome={() => {
          if (window.location.hash) {
            window.location.hash = '';
          }
          if (window.location.pathname.includes('/confirmar/')) {
            window.history.pushState(null, '', '/');
          }
          setPublicMatchId(null);
        }}
      />
    );
  }

  const handleOpenDetails = (match: Match, tab: 'substitutions' | 'stats' = 'substitutions') => {
    setActiveMatchForDetails(match);
    setMatchDetailsTab(tab);
  };

  const handleEditMatch = (match: Match) => {
    setMatchToEdit(match);
    setShowNewMatchModal(true);
  };

  const handleEditPlayer = (player: Player) => {
    setPlayerToEdit(player);
    setShowNewPlayerModal(true);
  };

  const handleRecordPaymentForPlayer = (player: Player) => {
    setPlayerForDirectPayment(player);
    setCurrentTab('finances');
  };

  // Render content according to active tab and role
  const renderTabContent = () => {
    // If in Player mode and on dashboard, render the dedicated player portal
    if (userRole === 'PLAYER' && currentTab === 'dashboard') {
      return <PlayerPortalView onOpenRoleModal={() => setShowRoleModal(true)} />;
    }

    switch (currentTab) {
      case 'dashboard':
        return (
          <DashboardView
            onNavigateTab={(tab) => setCurrentTab(tab)}
            onOpenNewMatch={() => {
              setMatchToEdit(null);
              setShowNewMatchModal(true);
            }}
            onOpenNewPlayer={() => {
              setPlayerToEdit(null);
              setShowNewPlayerModal(true);
            }}
            onOpenCallup={(match) => setActiveMatchForCallup(match)}
            onOpenScore={(match) => setActiveMatchForScore(match)}
            onOpenDetails={handleOpenDetails}
            onSelectPlayer={(player) => setSelectedPlayerForDetail(player)}
            onOpenInstallModal={() => setShowInstallModal(true)}
            onOpenConfirmationDashboard={(match) => setActiveMatchForConfirmations(match)}
            onOpenMatchdayGraphic={(match) => setActiveMatchForGraphic(match)}
          />
        );
      case 'matches':
        return (
          <MatchesView
            onOpenNewMatch={() => {
              setMatchToEdit(null);
              setShowNewMatchModal(true);
            }}
            onOpenCallup={(match) => setActiveMatchForCallup(match)}
            onOpenScore={(match) => setActiveMatchForScore(match)}
            onOpenDetails={handleOpenDetails}
            onEditMatch={handleEditMatch}
            onOpenConfirmationDashboard={(match) => setActiveMatchForConfirmations(match)}
            onOpenMatchdayGraphic={(match) => setActiveMatchForGraphic(match)}
          />
        );
      case 'players':
        return (
          <PlayerList
            onOpenPlayerDetail={(player) => setSelectedPlayerForDetail(player)}
            onOpenNewPlayer={() => {
              setPlayerToEdit(null);
              setShowNewPlayerModal(true);
            }}
          />
        );
      case 'finances':
        return (
          <FinanceView initialPlayerForPayment={playerForDirectPayment} />
        );
      case 'stats':
        return (
          <StatsView
            onSelectPlayer={(player) => setSelectedPlayerForDetail(player)}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className={`min-h-screen bg-slate-100 flex flex-col font-sans transition-all duration-300 ${isMobileFrame ? 'p-0 sm:p-4 bg-slate-900 flex items-center justify-center' : ''}`}>
      {/* Container wrapper for optional Mobile Preview Frame on Desktop */}
      <div className={`w-full flex-1 flex flex-col bg-slate-100 shadow-xl transition-all overflow-x-hidden ${isMobileFrame ? 'max-w-md h-[95vh] sm:rounded-[40px] border-4 border-slate-700 overflow-hidden relative shadow-2xl' : 'max-w-4xl mx-auto'}`}>
        
        {/* Top Header Navigation */}
        <TopAppBar
          onOpenTeamModal={() => setShowTeamModal(true)}
          onOpenRoleModal={() => setShowRoleModal(true)}
          onOpenBackupModal={() => setShowBackupModal(true)}
          onOpenInstallModal={() => setShowInstallModal(true)}
          isMobileFrame={isMobileFrame}
          onToggleMobileFrame={() => setIsMobileFrame(!isMobileFrame)}
        />

        {/* Main Content Scrollable Area with generous bottom padding for bottom nav */}
        <main className="flex-1 p-4 pb-28 overflow-y-auto">
          {renderTabContent()}
        </main>

        {/* Fixed Mobile Bottom Navigation Bar with Debt Warning Badge */}
        <BottomNavBar
          currentTab={currentTab}
          onTabChange={(tab: NavTab) => setCurrentTab(tab)}
          hasPendingDebts={hasPendingDebts}
        />
      </div>

      {/* Global Modals */}
      <TeamSelectorModal
        isOpen={showTeamModal}
        onClose={() => setShowTeamModal(false)}
      />

      <RoleSelectorModal
        isOpen={showRoleModal}
        onClose={() => setShowRoleModal(false)}
      />

      <BackupModal
        isOpen={showBackupModal}
        onClose={() => setShowBackupModal(false)}
      />

      {/* Convocatoria Masiva 1-Clic & WhatsApp Modal */}
      <ConvocatoriaModal
        match={activeMatchForCallup}
        isOpen={!!activeMatchForCallup}
        onClose={() => setActiveMatchForCallup(null)}
      />

      {/* Live Confirmation Dashboard Modal */}
      <ConfirmationDashboardModal
        match={activeMatchForConfirmations}
        isOpen={!!activeMatchForConfirmations}
        onClose={() => setActiveMatchForConfirmations(null)}
        onOpenMatchdayGraphic={(match) => setActiveMatchForGraphic(match)}
      />

      {/* Matchday Graphic & Final Squad Announcement Modal */}
      <MatchdayGraphicModal
        match={activeMatchForGraphic}
        isOpen={!!activeMatchForGraphic}
        onClose={() => setActiveMatchForGraphic(null)}
      />

      {/* Editar Marcador Manual (keypad + +/-) Modal */}
      <ScoreEditModal
        match={activeMatchForScore}
        isOpen={!!activeMatchForScore}
        onClose={() => setActiveMatchForScore(null)}
      />

      {/* Sustituciones & Rendimiento Individual Modal */}
      <MatchDetailsModal
        match={activeMatchForDetails}
        isOpen={!!activeMatchForDetails}
        defaultTab={matchDetailsTab}
        onClose={() => setActiveMatchForDetails(null)}
      />

      {/* New or Edit Match Modal */}
      <NewMatchModal
        isOpen={showNewMatchModal}
        onClose={() => {
          setShowNewMatchModal(false);
          setMatchToEdit(null);
        }}
        matchToEdit={matchToEdit}
      />

      {/* New or Edit Player Modal */}
      <PlayerFormModal
        isOpen={showNewPlayerModal}
        onClose={() => {
          setShowNewPlayerModal(false);
          setPlayerToEdit(null);
        }}
        playerToEdit={playerToEdit}
      />

      {/* Detailed Player Sheet Modal */}
      <PlayerDetailModal
        player={selectedPlayerForDetail}
        isOpen={!!selectedPlayerForDetail}
        onClose={() => setSelectedPlayerForDetail(null)}
        onEditPlayer={handleEditPlayer}
        onRecordPaymentForPlayer={handleRecordPaymentForPlayer}
      />

      {/* Direct 1-Click Install Modal for Android, Apple, Mac */}
      <DirectInstallModal
        isOpen={showInstallModal}
        onClose={() => setShowInstallModal(false)}
      />
    </div>
  );
}
