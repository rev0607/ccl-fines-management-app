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
  id: number;
  name: string;
  email: string;
  avatarUrl?: string;
  role: "viewer" | "admin" | "superadmin";
}

export default function HomePage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("Fines");
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      setIsLoading(true);
      
      try {
        // Check if user data exists in localStorage
        const storedUser = localStorage.getItem('ccl_user');
        const token = localStorage.getItem('bearer_token');
        
        if (storedUser && token) {
          const userData = JSON.parse(storedUser);
          
          // Verify session with server
          const response = await fetch('/api/auth/me', {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });

          if (response.ok) {
            const result = await response.json();
            setUser({
              id: result.user.id,
              name: result.user.name,
              email: result.user.email,
              avatarUrl: result.user.avatarUrl,
              role: result.user.role === 'super_admin' ? 'superadmin' : result.user.role
            });
            setIsAuthenticated(true);
          } else {
            // Session invalid, clear storage
            localStorage.removeItem('ccl_user');
            localStorage.removeItem('bearer_token');
          }
        }
      } catch (error) {
        console.error('Auth check error:', error);
        localStorage.removeItem('ccl_user');
        localStorage.removeItem('bearer_token');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const handleLoginSuccess = (userData: any) => {
    const mappedUser: User = {
      id: userData.id,
      name: userData.name,
      email: userData.email,
      avatarUrl: userData.avatarUrl,
      role: userData.role === 'super_admin' ? 'superadmin' : userData.role
    };
    
    setUser(mappedUser);
    setIsAuthenticated(true);
    setActiveTab("Fines"); // Default to Fines tab
  };

  const handleSignOut = async () => {
    try {
      const token = localStorage.getItem('bearer_token');
      if (token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear session data
      localStorage.removeItem('ccl_user');
      localStorage.removeItem('bearer_token');
      setIsAuthenticated(false);
      setUser(null);
      setActiveTab("Fines");
    }
  };

  const handleProfileClick = () => {
    // Handle profile modal/navigation
    console.log("Profile clicked");
  };

  // Get available tabs based on user role
  const getAvailableTabs = (): TabType[] => {
    if (!user) return ["Fines"];
    
    switch (user.role) {
      case "viewer":
        return ["Fines", "Reports"];
      case "admin":
        return ["Fines", "Reports", "Admin"];
      case "superadmin":
        return ["Fines", "Reports", "Admin"];
      default:
        return ["Fines"];
    }
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
        <AuthPages onLoginSuccess={handleLoginSuccess} />
        <Toaster position="top-center" richColors />
      </>
    );
  }

  // Render tab content based on active tab
  const renderTabContent = () => {
    switch (activeTab) {
      case "Fines":
        return <FinesPanel userRole={user?.role} />;
      case "Reports":
        return <ReportsPanel userRole={user?.role} />;
      case "Admin":
        return <AdminPanel userRole={user?.role} />;
      default:
        return <FinesPanel userRole={user?.role} />;
    }
  };

  const availableTabs = getAvailableTabs();

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
              {availableTabs.map((tab) => (
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