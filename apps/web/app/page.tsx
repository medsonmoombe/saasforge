"use client";

import { useState } from "react";
import { useAuthContext } from "@/lib/auth-context";
import { Header } from "@/components/Header";
import { ProjectSidebar } from "@/components/ProjectSidebar";
import { KanbanBoard } from "@/components/KanbanBoard";
import { LandingPage } from "@/components/LandingPage";
import { DashboardView } from "@/components/DashboardView";
import { ProjectsView } from "@/components/ProjectsView";
import { TeamView } from "@/components/TeamView";
import { SettingsView } from "@/components/SettingsView";
import { OrgSwitchLoader } from "@/components/OrgSwitchLoader";

export default function Home() {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [activeView, setActiveView] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { userId } = useAuthContext();

  if (!userId) {
    return (
      <main className="flex h-screen flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden">
        <Header onMenuClick={() => {}} showMenu={false} />
        <LandingPage />
      </main>
    );
  }

  const openProject = (id: string) => {
    setSelectedProjectId(id);
    setActiveView("board");
  };

  const renderContent = () => {
    if (activeView === "board" && selectedProjectId) return <KanbanBoard projectId={selectedProjectId} />;
    if (activeView === "projects") return <ProjectsView onOpenProject={openProject} />;
    if (activeView === "team") return <TeamView />;
    if (activeView === "settings") return <SettingsView />;
    return <DashboardView />;
  };

  return (
    <main className="flex h-screen flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden">
      <OrgSwitchLoader />
      <Header onMenuClick={() => setSidebarOpen(true)} showMenu={true} />
      <div className="flex flex-1 overflow-hidden">
        <ProjectSidebar
          selectedProjectId={selectedProjectId}
          onSelectProject={setSelectedProjectId}
          activeView={activeView}
          onChangeView={setActiveView}
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        {renderContent()}
      </div>
    </main>
  );
}
