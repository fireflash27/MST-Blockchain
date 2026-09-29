import React, { useState, useEffect } from 'react';
import { UserProfile, ScreeningRequest, AuditLog, UserRole } from './types/database';
import { 
  getCurrentUser, 
  switchDemoUser, 
  getScreenings, 
  getAuditLogs,
  logoutUser 
} from './lib/api';
import { Navbar } from './components/layout/Navbar';
import { AuthModal } from './components/auth/AuthModal';
import { AuthLanding } from './components/auth/AuthLanding';
import { PatientDashboard } from './components/patient/PatientDashboard';
import { NewScreeningWizard } from './components/patient/NewScreeningWizard';
import { MedicalProfileView } from './components/patient/MedicalProfileView';
import { HospitalDashboard } from './components/hospital/HospitalDashboard';
import { DoctorWorkstation } from './components/hospital/DoctorWorkstation';
import { AuditLogView } from './components/hospital/AuditLogView';
import { ScreeningDetailModal } from './components/screening/ScreeningDetailModal';
import { MSTBlockchainExplorerModal } from './components/blockchain/MSTBlockchainExplorerModal';
import { MasterPipeline } from './components/pipeline/MasterPipeline';
import { DataRetrievalPortal } from './components/retrieval/DataRetrievalPortal';
import { Eye, ShieldCheck, HeartPulse, Activity } from 'lucide-react';

export function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [screenings, setScreenings] = useState<ScreeningRequest[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Navigation & Modal State
  const [activeTab, setActiveTab] = useState<string>('patient_dashboard');
  const [showNewScreeningWizard, setShowNewScreeningWizard] = useState(false);
  const [selectedScreeningForDetail, setSelectedScreeningForDetail] = useState<ScreeningRequest | null>(null);
  const [selectedScreeningForWorkstation, setSelectedScreeningForWorkstation] = useState<ScreeningRequest | null>(null);
  const [showBlockchainModal, setShowBlockchainModal] = useState(false);

  // Auth Modal State
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authRole, setAuthRole] = useState<UserRole | null>(null);

  // Load initial data
  const loadData = async () => {
    try {
      const user = await getCurrentUser();
      if (user) {
        setCurrentUser(user);
        const [scrList, logsList] = await Promise.all([
          getScreenings(user),
          getAuditLogs()
        ]);
        setScreenings(scrList);
        setAuditLogs(logsList);

        // Adjust default active tab based on role
        if (user.role === 'doctor' || user.role === 'hospital_admin') {
          setActiveTab('hospital_dashboard');
        } else {
          setActiveTab('patient_dashboard');
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handle Auth Trigger
  const handleOpenAuth = (role: UserRole | null = null) => {
    setAuthRole(role);
    setShowAuthModal(true);
  };

  // Handle Auth Success
  const handleAuthSuccess = async (user: UserProfile) => {
    setCurrentUser(user);
    setLoading(true);
    try {
      const [scrList, logsList] = await Promise.all([
        getScreenings(user),
        getAuditLogs()
      ]);
      setScreenings(scrList);
      setAuditLogs(logsList);

      if (user.role === 'doctor' || user.role === 'hospital_admin') {
        setActiveTab('hospital_dashboard');
      } else {
        setActiveTab('patient_dashboard');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Handle Logout
  const handleLogout = async () => {
    await logoutUser();
    setCurrentUser(null);
    setShowNewScreeningWizard(false);
    setSelectedScreeningForWorkstation(null);
    setSelectedScreeningForDetail(null);
  };

  // Handle Switch User (Role Switcher)
  const handleSwitchUser = async (role: UserRole, index: number) => {
    setLoading(true);
    try {
      const newUser = await switchDemoUser(role, index);
      setCurrentUser(newUser);
      const scrList = await getScreenings(newUser);
      const logsList = await getAuditLogs();
      setScreenings(scrList);
      setAuditLogs(logsList);

      // Close open modals
      setShowNewScreeningWizard(false);
      setSelectedScreeningForWorkstation(null);
      setSelectedScreeningForDetail(null);

      // Switch active tab
      if (newUser.role === 'doctor' || newUser.role === 'hospital_admin') {
        setActiveTab('hospital_dashboard');
      } else {
        setActiveTab('patient_dashboard');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Refresh screenings and audit logs after an action
  const handleRefresh = async () => {
    if (!currentUser) return;
    const [scrList, logsList] = await Promise.all([
      getScreenings(currentUser),
      getAuditLogs()
    ]);
    setScreenings(scrList);
    setAuditLogs(logsList);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-teal-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-teal-500/20 animate-pulse mb-4">
          <Eye className="w-8 h-8 text-white" />
        </div>
        <p className="text-sm font-bold text-white tracking-wide">Initializing OcuTrust Healthcare Platform...</p>
        <p className="text-xs text-slate-500 mt-1">Configuring Database, Auth & Cryptographic Engine</p>
      </div>
    );
  }

  const urgentCasesCount = screenings.filter(
    s => (s.priority === 'urgent' || s.status === 'urgent_referral') && s.status !== 'diagnosed'
  ).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-teal-500 selection:text-white">
      
      {/* Top Navigation */}
      <Navbar
        currentUser={currentUser}
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setShowNewScreeningWizard(false);
          setSelectedScreeningForWorkstation(null);
          setActiveTab(tab);
        }}
        onSwitchUser={handleSwitchUser}
        onOpenNewScreening={() => setShowNewScreeningWizard(true)}
        onOpenBlockchainModal={() => setShowBlockchainModal(true)}
        onOpenAuth={handleOpenAuth}
        onLogout={handleLogout}
        urgentCount={urgentCount(screenings)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {!currentUser ? (
          /* Logged-out Landing & Auth Portal Selector */
          <AuthLanding onOpenAuth={handleOpenAuth} />
        ) : showNewScreeningWizard ? (
          /* 1. New Screening Request Wizard Mode */
          <NewScreeningWizard
            user={currentUser}
            onSuccess={(newScr) => {
              setShowNewScreeningWizard(false);
              handleRefresh();
              setSelectedScreeningForDetail(newScr);
            }}
            onCancel={() => setShowNewScreeningWizard(false)}
          />
        ) : selectedScreeningForWorkstation ? (
          /* 2. Doctor Diagnostic Workstation Mode */
          <DoctorWorkstation
            screening={selectedScreeningForWorkstation}
            doctor={currentUser}
            onBack={() => setSelectedScreeningForWorkstation(null)}
            onReportSubmitted={() => {
              setSelectedScreeningForWorkstation(null);
              handleRefresh();
            }}
          />
        ) : (
          /* 3. Primary Dashboard Tabs */
          <>
            {activeTab === 'patient_dashboard' && (
              <PatientDashboard
                user={currentUser}
                screenings={screenings}
                onNewScreening={() => setShowNewScreeningWizard(true)}
                onViewScreeningDetail={(scr) => setSelectedScreeningForDetail(scr)}
                onOpenBlockchainModal={() => setShowBlockchainModal(true)}
              />
            )}

            {activeTab === 'hospital_dashboard' && (
              <HospitalDashboard
                currentUser={currentUser}
                screenings={screenings}
                onOpenWorkstation={(scr) => setSelectedScreeningForWorkstation(scr)}
                onViewReport={(scr) => setSelectedScreeningForDetail(scr)}
                onOpenBlockchainModal={() => setShowBlockchainModal(true)}
              />
            )}

            {activeTab === 'medical_profile' && (
              <MedicalProfileView
                user={currentUser}
                onProfileUpdated={(updated) => {
                  setCurrentUser(updated);
                  handleRefresh();
                }}
              />
            )}

            {activeTab === 'audit_trail' && (
              <AuditLogView logs={auditLogs} />
            )}

            {activeTab === 'master_pipeline' && (
              <MasterPipeline onSwitchToRetrieval={() => setActiveTab('data_retrieval')} />
            )}

            {activeTab === 'data_retrieval' && (
              <DataRetrievalPortal onSwitchToStore={() => setActiveTab('master_pipeline')} />
            )}
          </>
        )}

      </main>

      {/* Authentication Modal */}
      <AuthModal
        isOpen={showAuthModal}
        initialRole={authRole}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
      />

      {/* Glaucoma Screening Detail / Report Modal */}
      {selectedScreeningForDetail && currentUser && (
        <ScreeningDetailModal
          screening={selectedScreeningForDetail}
          currentUser={currentUser}
          onClose={() => setSelectedScreeningForDetail(null)}
          onAnchorUpdate={handleRefresh}
          onOpenBlockchainModal={() => setShowBlockchainModal(true)}
        />
      )}

      {/* MST Blockchain Architecture & Integration Specification Modal */}
      {showBlockchainModal && (
        <MSTBlockchainExplorerModal
          onClose={() => setShowBlockchainModal(false)}
        />
      )}

      {/* Platform Footer */}
      <footer className="mt-auto border-t border-slate-800/80 bg-slate-950/60 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-teal-400" />
            <span className="font-semibold text-slate-300">OcuTrust Glaucoma Screening Platform</span>
            <span>•</span>
            <span>Patient + Hospital Core System</span>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <span>React + TypeScript</span>
            <span>•</span>
            <span>Tailwind CSS</span>
            <span>•</span>
            <span>Supabase PostgreSQL & Storage</span>
            <span>•</span>
            <span className="text-cyan-400 font-mono">MST Blockchain Live</span>
          </div>
        </div>
      </footer>

    </div>
  );
}

function urgentCount(screenings: ScreeningRequest[]): number {
  return screenings.filter(
    s => (s.priority === 'urgent' || s.status === 'urgent_referral') && s.status !== 'diagnosed'
  ).length;
}

export default App;
