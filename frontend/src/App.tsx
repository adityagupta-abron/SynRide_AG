import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { RideDiscovery } from './pages/RideDiscovery';
import { CreateRide } from './pages/CreateRide';
import { RideGroupDetail } from './pages/RideGroupDetail';
import { RoutesView } from './pages/RoutesView';
import { Profile } from './pages/Profile';
import { NotificationsPage } from './pages/NotificationsPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { Database } from 'lucide-react';

const MainApp: React.FC = () => {
  const { user, isAuthenticated, loading } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0b1120] text-slate-400">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold tracking-wider uppercase text-slate-400">Loading SynRide...</p>
        </div>
      </div>
    );
  }

  // Handle Unauthenticated State
  if (!isAuthenticated) {
    if (currentTab === 'register') {
      return (
        <div className="min-h-screen flex flex-col justify-between">
          <Navbar currentTab={currentTab} onSelectTab={(t) => setCurrentTab(t)} />
          <main className="flex-1 px-4 py-8 max-w-7xl mx-auto w-full">
            <Register
              onSuccess={() => setCurrentTab('dashboard')}
              onNavigateLogin={() => setCurrentTab('login')}
            />
          </main>
          <Footer />
        </div>
      );
    }
    return (
      <div className="min-h-screen flex flex-col justify-between">
        <Navbar currentTab={currentTab} onSelectTab={(t) => setCurrentTab(t)} />
        <main className="flex-1 px-4 py-8 max-w-7xl mx-auto w-full">
          <Login
            onSuccess={() => setCurrentTab('dashboard')}
            onNavigateRegister={() => setCurrentTab('register')}
          />
        </main>
        <Footer />
      </div>
    );
  }

  const navigateToGroup = (groupId: number) => {
    setSelectedGroupId(groupId);
    setCurrentTab('group_detail');
  };

  return (
    <div className="min-h-screen flex flex-col justify-between">
      <Navbar currentTab={currentTab} onSelectTab={(t) => setCurrentTab(t)} />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {currentTab === 'dashboard' && (
          <Dashboard 
            onNavigateTab={(t, gId) => {
              if (t === 'group_detail' && gId) {
                navigateToGroup(gId);
              } else {
                setCurrentTab(t);
              }
            }} 
          />
        )}

        {currentTab === 'rides' && (
          <RideDiscovery
            onSelectGroup={(gId) => navigateToGroup(gId)}
            onCreateNewRide={() => setCurrentTab('request')}
          />
        )}

        {currentTab === 'request' && (
          <CreateRide
            onRideCreated={(gId) => navigateToGroup(gId)}
            onCancel={() => setCurrentTab('dashboard')}
          />
        )}

        {currentTab === 'group_detail' && selectedGroupId && (
          <RideGroupDetail
            groupId={selectedGroupId}
            onBack={() => setCurrentTab('dashboard')}
          />
        )}

        {currentTab === 'routes' && (
          <RoutesView
            onSelectRoute={(p, d) => {
              setCurrentTab('request');
            }}
          />
        )}

        {currentTab === 'profile' && <Profile />}

        {currentTab === 'notifications' && (
          <NotificationsPage
            onNavigateGroup={(gId) => navigateToGroup(gId)}
          />
        )}

        {currentTab === 'admin' && <AdminDashboard />}
      </main>

      <Footer />
    </div>
  );
};

const Footer: React.FC = () => {
  return (
    <footer className="border-t border-slate-800/80 glass-panel py-6 text-xs text-slate-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-2">
          <Database size={15} className="text-emerald-400" />
          <span>
            SynRide Academic DBMS Project • Oracle AI Database 26ai Free (FREEPDB1) • FastAPI • React TypeScript
          </span>
        </div>
        <div className="text-slate-400">
          Designed for eligible VIT Students & Faculty/Staff
        </div>
      </div>
    </footer>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
};

export default App;
