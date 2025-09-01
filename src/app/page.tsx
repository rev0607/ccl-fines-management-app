"use client";

import { useState, useEffect } from "react";
import { Toaster } from "sonner";
import TopBar from "@/components/TopBar";
import AuthPages from "@/components/AuthPages";
import FinesPanel from "@/components/FinesPanel";
import ReportsPanel from "@/components/ReportsPanel";
import AdminPanel from "@/components/AdminPanel";

type TabType = "Fines" | "Reports" | "Admin";

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: "viewer" | "admin" | "superadmin";
}

export default function HomePage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("Fines");
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Mock authentication check on mount
  useEffect(() => {
    const checkAuth = async () => {
      setIsLoading(true);
      // Simulate checking for existing session
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock user data - in real app this would come from API/localStorage
      const mockUser: User = {
        id: "1",
        name: "John Smith",
        email: "john@ccl.com", 
        avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
        role: "admin"
      };
      
      setUser(mockUser);
      setIsAuthenticated(true);
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const handleSignOut = () => {
    setIsAuthenticated(false);
    setUser(null);
    setActiveTab("Fines");
  };

  const handleProfileClick = () => {
    // Handle profile modal/navigation
    console.log("Profile clicked");
  };

  // Loading screen
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading CCL Fines...</p>
        </div>
      </div>
    );
  }

  // Show auth pages if not authenticated
  if (!isAuthenticated) {
    return (
      <>
        <AuthPages />
        <Toaster position="top-center" richColors />
      </>
    );
  }

  // Render tab content based on active tab
  const renderTabContent = () => {
    switch (activeTab) {
      case "Fines":
        return <FinesPanel />;
      case "Reports":
        return <ReportsPanel />;
      case "Admin":
        return <AdminPanel />;
      default:
        return <FinesPanel />;
    }
  };

  // Main authenticated app shell
  return (
    <div className="min-h-screen bg-background">
      {/* Fixed TopBar */}
      <TopBar
        currentTab={activeTab}
        user={user || undefined}
        onProfileClick={handleProfileClick}
        onSignOut={handleSignOut}
      />

      {/* Main Content Area */}
      <main className="pt-16">
        {/* Tab Navigation */}
        <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-16 z-40">
          <div className="max-w-7xl mx-auto px-4 md:px-6">
            <nav className="flex space-x-8" aria-label="Main navigation">
              {(["Fines", "Reports", "Admin"] as TabType[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground"
                  }`}
                  aria-current={activeTab === tab ? "page" : undefined}
                >
                  {tab}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="max-w-7xl mx-auto">
          {renderTabContent()}
        </div>
      </main>

      {/* Global Toast Notifications */}
      <Toaster position="top-center" richColors />
    </div>
  );
}