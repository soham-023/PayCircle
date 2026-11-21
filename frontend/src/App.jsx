import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { groupAPI } from './services/api';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import AddExpenseModal from './components/AddExpenseModal';
import CreateGroupModal from './components/CreateGroupModal';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Groups from './pages/Groups';
import GroupDetail from './pages/GroupDetail';
import Expenses from './pages/Expenses';
import Settlements from './pages/Settlements';
import PaymentRequests from './pages/PaymentRequests';
import Budgets from './pages/Budgets';
import Analytics from './pages/Analytics';
import ActivityLog from './pages/ActivityLog';
import Profile from './pages/Profile';

function MainApp() {
  const { user, loading } = useAuth();
  const [authView, setAuthView] = useState('login');
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [groups, setGroups] = useState([]);

  // Modal triggers
  const [addExpenseModalOpen, setAddExpenseModalOpen] = useState(false);
  const [expenseDefaultGroupId, setExpenseDefaultGroupId] = useState(null);
  const [createGroupModalOpen, setCreateGroupModalOpen] = useState(false);

  const fetchGroups = async () => {
    try {
      const res = await groupAPI.getGroups();
      setGroups(res.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (user) {
      fetchGroups();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-emerald-400 font-bold text-sm">
        Initializing PayCircle...
      </div>
    );
  }

  if (!user) {
    return authView === 'login' ? (
      <Login onSwitchToRegister={() => setAuthView('register')} />
    ) : (
      <Register onSwitchToLogin={() => setAuthView('login')} />
    );
  }

  const handleNavigate = (tab, groupId = null) => {
    setCurrentTab(tab);
    if (groupId) {
      setSelectedGroupId(groupId);
    } else {
      setSelectedGroupId(null);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenAddExpense = (groupId = null) => {
    setExpenseDefaultGroupId(groupId);
    setAddExpenseModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar onOpenProfile={() => handleNavigate('profile')} />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar
          currentTab={currentTab}
          setTab={(t) => handleNavigate(t)}
          onOpenAddExpense={() => handleOpenAddExpense(null)}
          onOpenCreateGroup={() => setCreateGroupModalOpen(true)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0">
          {currentTab === 'dashboard' && (
            <Dashboard
              onNavigate={handleNavigate}
              onOpenAddExpense={() => handleOpenAddExpense(null)}
              onOpenCreateGroup={() => setCreateGroupModalOpen(true)}
              onOpenPaymentRequest={() => handleNavigate('requests')}
            />
          )}

          {currentTab === 'groups' && !selectedGroupId && (
            <Groups
              onSelectGroup={(id) => setSelectedGroupId(id)}
              onOpenCreateGroup={() => setCreateGroupModalOpen(true)}
            />
          )}

          {currentTab === 'groups' && selectedGroupId && (
            <GroupDetail
              groupId={selectedGroupId}
              onBack={() => setSelectedGroupId(null)}
              onOpenAddExpense={(gid) => handleOpenAddExpense(gid)}
            />
          )}

          {currentTab === 'expenses' && (
            <Expenses onOpenAddExpense={() => handleOpenAddExpense(null)} />
          )}

          {currentTab === 'settlements' && (
            <Settlements />
          )}

          {currentTab === 'requests' && (
            <PaymentRequests />
          )}

          {currentTab === 'budgets' && (
            <Budgets />
          )}

          {currentTab === 'analytics' && (
            <Analytics />
          )}

          {currentTab === 'activity' && (
            <ActivityLog />
          )}

          {currentTab === 'profile' && (
            <Profile />
          )}
        </main>
      </div>

      {/* Global Modals */}
      <AddExpenseModal
        isOpen={addExpenseModalOpen}
        onClose={() => setAddExpenseModalOpen(false)}
        groups={groups}
        defaultGroupId={expenseDefaultGroupId}
        onExpenseAdded={() => {
          fetchGroups();
          // Trigger reload on current view
          handleNavigate(currentTab, selectedGroupId);
        }}
      />

      <CreateGroupModal
        isOpen={createGroupModalOpen}
        onClose={() => setCreateGroupModalOpen(false)}
        onGroupCreated={() => {
          fetchGroups();
          handleNavigate('groups');
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <MainApp />
      </NotificationProvider>
    </AuthProvider>
  );
}
