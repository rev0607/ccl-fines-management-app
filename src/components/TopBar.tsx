"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { 
  User, 
  LogOut, 
  Settings, 
  Moon, 
  Sun, 
  Bell,
  Shield,
  Crown,
  X
} from "lucide-react"
import { toast } from "sonner"

interface TopBarUser {
  id: number;
  name: string;
  email: string;
  avatarUrl?: string;
  role: "viewer" | "admin" | "superadmin";
}

interface SystemConfig {
  currency: string;
  fineFrequency: 'match' | 'week' | 'season';
  appName: string;
  logoUrl?: string;
}

interface TopBarProps {
  currentTab: string;
  user?: TopBarUser;
  onProfileClick: () => void;
  onSignOut: () => void;
}

export default function TopBar({ currentTab, user, onProfileClick, onSignOut }: TopBarProps) {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [systemConfig, setSystemConfig] = useState<SystemConfig>({
    currency: '₹',
    fineFrequency: 'match',
    appName: 'CCL Fines',
  });

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle("dark");
  };

  const handleProfileClick = () => {
    setShowProfileModal(true);
  };

  const handleSettingsClick = () => {
    setShowSettingsModal(true);
  };

  const handleSaveSettings = () => {
    // In a real app, this would save to the backend
    toast.success("Settings saved successfully");
    setShowSettingsModal(false);
  };

  const getUserInitials = (name: string) => {
    return name
      .split(" ")
      .map(word => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "superadmin":
        return <Crown className="h-3 w-3" />;
      case "admin":
        return <Shield className="h-3 w-3" />;
      default:
        return <User className="h-3 w-3" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "superadmin":
        return "destructive";
      case "admin":
        return "default";
      default:
        return "secondary";
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "superadmin":
        return "Super Admin";
      case "admin":
        return "Admin";
      default:
        return "Viewer";
    }
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="flex items-center justify-between h-16">
            {/* App Branding */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-sm">CF</span>
                </div>
                <div>
                  <h1 className="font-display font-bold text-lg">CCL Fines</h1>
                </div>
              </div>
            </div>

            {/* Current Tab Title */}
            <div className="flex-1 flex justify-center">
              <h2 className="text-xl font-display font-semibold text-foreground">
                {currentTab}
              </h2>
            </div>

            {/* User Actions */}
            <div className="flex items-center space-x-4">
              {user && (
                <>
                  {/* Notifications */}
                  <Button variant="ghost" size="sm" className="relative">
                    <Bell className="h-4 w-4" />
                    <span className="absolute -top-1 -right-1 h-3 w-3 bg-destructive rounded-full text-xs"></span>
                  </Button>

                  {/* User Menu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="relative h-10 w-auto px-3 rounded-full">
                        <div className="flex items-center space-x-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={user.avatarUrl} alt={user.name} />
                            <AvatarFallback className="text-xs">
                              {getUserInitials(user.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="hidden md:flex flex-col items-start">
                            <span className="text-sm font-medium">{user.name}</span>
                            <Badge 
                              variant={getRoleColor(user.role)} 
                              className="text-xs h-4 px-1 gap-1"
                            >
                              {getRoleIcon(user.role)}
                              {getRoleLabel(user.role)}
                            </Badge>
                          </div>
                        </div>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end" forceMount>
                      <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-medium leading-none">{user.name}</p>
                          <p className="text-xs leading-none text-muted-foreground">
                            {user.email}
                          </p>
                          <div className="pt-1">
                            <Badge 
                              variant={getRoleColor(user.role)} 
                              className="text-xs h-5 px-2 gap-1"
                            >
                              {getRoleIcon(user.role)}
                              {getRoleLabel(user.role)}
                            </Badge>
                          </div>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleProfileClick}>
                        <User className="mr-2 h-4 w-4" />
                        <span>Profile</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleSettingsClick}>
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Settings</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={toggleTheme}>
                        {isDarkMode ? (
                          <Sun className="mr-2 h-4 w-4" />
                        ) : (
                          <Moon className="mr-2 h-4 w-4" />
                        )}
                        <span>Toggle theme</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={onSignOut} className="text-destructive">
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Sign out</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Profile Modal */}
      <Dialog open={showProfileModal} onOpenChange={setShowProfileModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>Profile Information</DialogTitle>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowProfileModal(false)}
                className="h-6 w-6 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <DialogDescription>
              Your account details and role information
            </DialogDescription>
          </DialogHeader>
          {user && (
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={user.avatarUrl} alt={user.name} />
                  <AvatarFallback className="text-lg">
                    {getUserInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">{user.name}</h3>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                  <Badge 
                    variant={getRoleColor(user.role)} 
                    className="text-xs gap-1"
                  >
                    {getRoleIcon(user.role)}
                    {getRoleLabel(user.role)}
                  </Badge>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Full Name</Label>
                    <p className="text-sm font-medium">{user.name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Email Address</Label>
                    <p className="text-sm font-medium">{user.email}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">User Role</Label>
                    <p className="text-sm font-medium">{getRoleLabel(user.role)}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">User ID</Label>
                    <p className="text-sm font-medium">#{user.id}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Settings Modal */}
      <Dialog open={showSettingsModal} onOpenChange={setShowSettingsModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>Settings & Customization</DialogTitle>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowSettingsModal(false)}
                className="h-6 w-6 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <DialogDescription>
              Configure app settings and customize your experience
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Currency Settings</CardTitle>
                <CardDescription>
                  Choose the currency symbol for displaying fines
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div>
                  <Label htmlFor="currency">Currency Symbol</Label>
                  <Select 
                    value={systemConfig.currency} 
                    onValueChange={(value) => setSystemConfig(prev => ({ ...prev, currency: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="$">$ (US Dollar)</SelectItem>
                      <SelectItem value="₹">₹ (Indian Rupee)</SelectItem>
                      <SelectItem value="€">€ (Euro)</SelectItem>
                      <SelectItem value="£">£ (British Pound)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Fine Frequency</CardTitle>
                <CardDescription>
                  Set how often fines are collected and reset
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div>
                  <Label htmlFor="frequency">Collection Frequency</Label>
                  <Select 
                    value={systemConfig.fineFrequency} 
                    onValueChange={(value: 'match' | 'week' | 'season') => 
                      setSystemConfig(prev => ({ ...prev, fineFrequency: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="match">Per Match</SelectItem>
                      <SelectItem value="week">Weekly</SelectItem>
                      <SelectItem value="season">Per Season</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Branding</CardTitle>
                <CardDescription>
                  Customize the app name and branding
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="app-name">App Name</Label>
                  <Input
                    id="app-name"
                    value={systemConfig.appName}
                    onChange={(e) => setSystemConfig(prev => ({ ...prev, appName: e.target.value }))}
                    placeholder="CCL Fines"
                  />
                </div>
                <div>
                  <Label htmlFor="logo-url">Logo URL (optional)</Label>
                  <Input
                    id="logo-url"
                    value={systemConfig.logoUrl || ''}
                    onChange={(e) => setSystemConfig(prev => ({ ...prev, logoUrl: e.target.value }))}
                    placeholder="https://example.com/logo.png"
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowSettingsModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveSettings}>
                Save Settings
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}