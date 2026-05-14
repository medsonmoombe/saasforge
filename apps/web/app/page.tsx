"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { Header } from "@/components/Header";
import { ProjectSidebar } from "@/components/ProjectSidebar";
import { KanbanBoard } from "@/components/KanbanBoard";
import { LandingPage } from "@/components/LandingPage";

export default function Home() {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const { userId } = useAuth();

  if (!userId) {
    return (
      <main className="flex h-screen flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden">
        <Header />
        <LandingPage />
      </main>
    );
  }

  return (
    <main className="flex h-screen flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <ProjectSidebar 
          selectedProjectId={selectedProjectId} 
          onSelectProject={setSelectedProjectId} 
        />
        {selectedProjectId ? (
          <KanbanBoard projectId={selectedProjectId} />
        ) : (
          <div className="flex flex-1 items-center justify-center text-slate-400 text-sm">
            Select a project to view board
          </div>
        )}
      </div>
    </main>
  );
}
