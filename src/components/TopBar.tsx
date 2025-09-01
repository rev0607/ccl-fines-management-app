"use client"

import { useState, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { ChevronDown } from "lucide-react"

interface TopBarProps {
  currentTab?: string
  user?: {
    name?: string
    email?: string
    avatar?: string
    role?: string
  }
  onProfileClick?: () => void
  onSignOut?: () => void
}

export default function TopBar({ 
  currentTab = "Fines", 
  user = {
    name: "John Doe",
    email: "john@example.com",
    role: "Admin"
  },
  onProfileClick,
  onSignOut 
}: TopBarProps) {
  const [theme, setTheme] = useState<"light" | "dark">("light")
  const [mounted, setMounted] = useState(false)

  // Handle theme initialization and persistence
  useEffect(() => {
    setMounted(true)
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null
    const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
    const initialTheme = savedTheme || systemTheme
    
    setTheme(initialTheme)
    document.documentElement.classList.toggle("dark", initialTheme === "dark")
  }, [])

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light"
    setTheme(newTheme)
    localStorage.setItem("theme", newTheme)
    document.documentElement.classList.toggle("dark", newTheme === "dark")
  }

  const handleProfileClick = () => {
    onProfileClick?.()
  }

  const handleSignOut = () => {
    onSignOut?.()
  }

  // Get user initials for avatar fallback
  const getUserInitials = (name?: string) => {
    if (!name) return "U"
    return name
      .split(" ")
      .map(part => part.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  // Don't render until mounted to avoid hydration mismatch
  if (!mounted) {
    return (
      <header className="fixed top-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center justify-between h-16 px-4 md:px-6">
          <div className="flex items-center">
            <h1 className="text-xl md:text-2xl font-display font-bold text-foreground">
              CCLFines
            </h1>
          </div>
          <div className="hidden sm:block">
            <h2 className="text-lg font-display font-semibold text-foreground">
              {currentTab}
            </h2>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
          </div>
        </div>
      </header>
    )
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-sm border-b border-border">
      <div className="flex items-center justify-between h-16 px-4 md:px-6">
        {/* Left: Brand */}
        <div className="flex items-center">
          <h1 className="text-xl md:text-2xl font-display font-bold text-foreground tracking-tight">
            <span className="hidden sm:inline">CCLFines</span>
            <span className="sm:hidden">CCL</span>
          </h1>
        </div>

        {/* Center: Current Tab Title */}
        <div className="hidden sm:block">
          <h2 className="text-lg font-display font-semibold text-foreground">
            {currentTab}
          </h2>
        </div>
        <div className="sm:hidden">
          <h2 className="text-sm font-display font-medium text-muted-foreground">
            {currentTab}
          </h2>
        </div>

        {/* Right: Avatar Dropdown */}
        <div className="flex items-center space-x-3">
          {/* Role Status Indicator */}
          {user.role && (
            <div className="hidden md:flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span className="text-sm font-medium text-muted-foreground">
                {user.role}
              </span>
            </div>
          )}

          {/* Avatar Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className="relative h-8 w-8 rounded-full p-0 hover:bg-accent"
                aria-label="Open user menu"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.avatar} alt={user.name || "User avatar"} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs font-medium">
                    {getUserInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                {user.role && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-card rounded-full md:hidden" />
                )}
              </Button>
            </DropdownMenuTrigger>
            
            <DropdownMenuContent 
              className="w-56" 
              align="end" 
              forceMount
              aria-label="User menu"
            >
              <div className="flex items-center justify-start gap-2 p-2">
                <div className="flex flex-col space-y-1 leading-none">
                  {user.name && (
                    <p className="font-medium text-sm text-foreground">{user.name}</p>
                  )}
                  {user.email && (
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  )}
                  {user.role && (
                    <div className="flex items-center gap-1.5 md:hidden">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                      <span className="text-xs text-muted-foreground">{user.role}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem onClick={handleProfileClick} className="cursor-pointer">
                Profile
              </DropdownMenuItem>
              
              <DropdownMenuItem onClick={toggleTheme} className="cursor-pointer">
                {theme === "light" ? "Switch to Dark" : "Switch to Light"}
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem 
                onClick={handleSignOut} 
                className="cursor-pointer text-destructive focus:text-destructive"
              >
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}