"use client";

import { useState, useEffect } from "react";
import { Toaster } from "sonner";
import TopBar from "@/components/TopBar";
import AuthPages from "@/components/AuthPages";
import FinesPanel from "@/components/FinesPanel";
import ReportsPanel from "@/components/ReportsPanel";
import AdminPanel from "@/components/AdminPanel";
import { authClient, useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type TabType = "Fines" | "Reports" | "Admin";

interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
  role?: "viewer" | "admin" | "superadmin";
}

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<TabType>("Fines");
  const [user, setUser] = useState<User | null>(null);
  const { data: session, isPending, refetch } = useSession();
  const router = useRouter();

  // Check authentication and update user state
  useEffect(() => {
    if (session?.user) {
      // Map better-auth session to our user interface
      setUser({
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        image: session.user.image,
        role: session.user.role || "viewer" // Default to viewer if no role set
      });
    } else {
      setUser(null);
    }
  }, [session]);

  const handleLoginSuccess = (userData: any) => {
    if (userData) {
      setUser({
        id: userData.id,
        name: userData.name,
        email: userData.email,
        image: userData.image,
        role: userData.role || "viewer"
      });
      setActiveTab("Fines"); // Default to Fines tab
      refetch(); // Refresh session state
    }
  };

  const handleSignOut = async () => {
    try {
      const token = localStorage.getItem("bearer_token");
      const { error } = await authClient.signOut({
        fetchOptions: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      });
      
      if (error?.code) {
        toast.error(error.code);
      } else {
        localStorage.removeItem("bearer_token");
        setUser(null);
        setActiveTab("Fines");
        refetch(); // Update session state
        router.push("/");
        toast.success("Signed out successfully");
      }
    } catch (error) {
      console.error('Logout error:', error);
      localStorage.removeItem("bearer_token");
      setUser(null);
      setActiveTab("Fines");
      refetch();
      router.push("/");
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
        return ["Fines", "Reports"];
    }
  };

  // Loading screen while checking authentication
  if (isPending) {
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
  if (!session?.user) {
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
            <nav 
              className={`flex space-x-8 ${
                availableTabs.length === 2 ? 'justify-center' : ''
              }`} 
              aria-label="Main navigation"
            >
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