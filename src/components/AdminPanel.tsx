"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Users, 
  UserCheck, 
  UserX, 
  RotateCcw,
  Eye,
  EyeOff,
  Settings,
  Shield,
  Crown,
  CheckCircle,
  XCircle,
  Calendar,
  TrendingUp,
  DollarSign,
  FileText,
  UserPlus,
  Undo2,
  ScrollText
} from "lucide-react";
import { toast } from "sonner";

interface Player {
  id: number;
  name: string;
  email: string;
  jerseyNumber: string;
  position: string;
  totalFines?: number;
  deletedAt?: string;
  createdAt: string;
}

interface FineReason {
  id: number;
  name: string;
  defaultAmount: number;
  description?: string;
  deletedAt?: string;
  usageCount?: number;
}

interface UserRole {
  id: number;
  email: string;
  name: string;
  role: 'viewer' | 'admin' | 'superadmin';
  avatarUrl?: string;
  createdAt: string;
  isActive?: boolean;
  lastLoginAt?: string;
}

interface AdminPanelProps {
  userRole?: "viewer" | "admin" | "superadmin";
}

export default function AdminPanel({ userRole = "admin" }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState("players");
  
  // State for data
  const [players, setPlayers] = useState<Player[]>([]);
  const [fineReasons, setFineReasons] = useState<FineReason[]>([]);
  const [users, setUsers] = useState<UserRole[]>([]);

  // Loading states
  const [isLoading, setIsLoading] = useState(true);

  // UI states
  const [showDeletedPlayers, setShowDeletedPlayers] = useState(false);
  const [showDeletedReasons, setShowDeletedReasons] = useState(false);

  // Add data refresh mechanism
  const refreshAllData = async () => {
    const token = localStorage.getItem('bearer_token');
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };

    try {
      // Refresh players
      const playersResponse = await fetch('/api/players', { headers });
      if (playersResponse.ok) {
        const playersData = await playersResponse.json();
        setPlayers(Array.isArray(playersData) ? playersData : []);
      }

      // Refresh fine reasons
      const reasonsResponse = await fetch('/api/fine-reasons', { headers });
      if (reasonsResponse.ok) {
        const reasonsData = await reasonsResponse.json();
        setFineReasons(Array.isArray(reasonsData) ? reasonsData : []);
      }

      // Refresh users (only for super admin)
      if (userRole === 'superadmin') {
        const usersResponse = await fetch('/api/users', { headers });
        if (usersResponse.ok) {
          const usersData = await usersResponse.json();
          setUsers(Array.isArray(usersData) ? usersData : []);
        }
      }
    } catch (error) {
      console.error('Error refreshing data:', error);
    }
  };

  // Listen for storage events to refresh data when other tabs make changes
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'players_data_updated' || e.key === 'fine_reasons_data_updated') {
        refreshAllData();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [userRole]);

  // Fetch all data on mount
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem('bearer_token');
        const headers = {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        };

        // Fetch players
        const playersResponse = await fetch('/api/players', { headers });
        if (playersResponse.ok) {
          const playersData = await playersResponse.json();
          setPlayers(Array.isArray(playersData) ? playersData : []);
        }

        // Fetch fine reasons
        const reasonsResponse = await fetch('/api/fine-reasons', { headers });
        if (reasonsResponse.ok) {
          const reasonsData = await reasonsResponse.json();
          setFineReasons(Array.isArray(reasonsData) ? reasonsData : []);
        }

        // Fetch users (only for super admin)
        if (userRole === 'superadmin') {
          const usersResponse = await fetch('/api/users', { headers });
          if (usersResponse.ok) {
            const usersData = await usersResponse.json();
            setUsers(Array.isArray(usersData) ? usersData : []);
          } else {
            console.error('Failed to fetch users:', usersResponse.status);
            setUsers([]);
          }
        } else {
          setUsers([]);
        }

      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load admin data');
        setPlayers([]);
        setFineReasons([]);
        setUsers([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [userRole]);

  const canManageAll = userRole === "superadmin";
  const canManageBasic = userRole === "admin" || userRole === "superadmin";

  if (isLoading) {
    return (
      <div className="w-full max-w-7xl mx-auto p-6 flex items-center justify-center min-h-96">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  if (!canManageBasic) {
    return (
      <div className="w-full max-w-7xl mx-auto p-6">
        <Card>
          <CardContent className="text-center py-12">
            <Shield className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Access Restricted</h2>
            <p className="text-muted-foreground">
              You don't have permission to access the admin panel. 
              Contact your system administrator for access.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold">Admin Panel</h1>
          <p className="text-muted-foreground">
            Manage players, fine reasons, and system settings
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="players">Players</TabsTrigger>
          <TabsTrigger value="reasons">Fine Reasons</TabsTrigger>
          {canManageAll && <TabsTrigger value="users">Users</TabsTrigger>}
        </TabsList>

        <TabsContent value="players">
          <ManagePlayersTab 
            players={players}
            setPlayers={setPlayers}
            showDeletedPlayers={showDeletedPlayers}
            setShowDeletedPlayers={setShowDeletedPlayers}
          />
        </TabsContent>

        <TabsContent value="reasons">
          <ManageFineReasonsTab 
            fineReasons={fineReasons}
            setFineReasons={setFineReasons}
            showDeletedReasons={showDeletedReasons}
            setShowDeletedReasons={setShowDeletedReasons}
          />
        </TabsContent>

        {canManageAll && (
          <TabsContent value="users">
            <ManageUsersTab 
              users={users}
              setUsers={setUsers}
            />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

interface ManagePlayersTabProps {
  players: Player[];
  setPlayers: (players: Player[]) => void;
  showDeletedPlayers: boolean;
  setShowDeletedPlayers: (show: boolean) => void;
}

function ManagePlayersTab({ players, setPlayers, showDeletedPlayers, setShowDeletedPlayers }: ManagePlayersTabProps) {
  const [showPlayerForm, setShowPlayerForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [playerForm, setPlayerForm] = useState({
    name: '',
    email: '',
    jerseyNumber: '',
    position: ''
  });

  const activePlayers = players.filter(player => !player.deletedAt);
  const deletedPlayers = players.filter(player => player.deletedAt);

  const handleAddPlayer = async () => {
    if (!playerForm.name || !playerForm.email || !playerForm.jerseyNumber) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('bearer_token');
      const response = await fetch('/api/players', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: playerForm.name,
          email: playerForm.email,
          jersey_number: playerForm.jerseyNumber,
          position: playerForm.position
        }),
      });

      if (response.ok) {
        const newPlayer = await response.json();
        setPlayers([...players, newPlayer]);
        setPlayerForm({ name: '', email: '', jerseyNumber: '', position: '' });
        setShowPlayerForm(false);
        toast.success("Player added successfully");
        localStorage.setItem('players_data_updated', Date.now().toString());
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to add player");
      }
    } catch (error) {
      console.error('Add player error:', error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSoftDeletePlayer = async (playerId: number) => {
    try {
      const token = localStorage.getItem('bearer_token');
      const response = await fetch(`/api/players/${playerId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const updatedPlayers = players.map(p => 
          p.id === playerId ? { ...p, deletedAt: new Date().toISOString() } : p
        );
        setPlayers(updatedPlayers);
        toast.success("Player deleted successfully");
        localStorage.setItem('players_data_updated', Date.now().toString());
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to delete player");
      }
    } catch (error) {
      console.error('Delete player error:', error);
      toast.error("Something went wrong. Please try again.");
    }
  };

  const handleRestorePlayer = async (playerId: number) => {
    try {
      const token = localStorage.getItem('bearer_token');
      const response = await fetch(`/api/players/${playerId}/restore`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const updatedPlayers = players.map(p => 
          p.id === playerId ? { ...p, deletedAt: undefined } : p
        );
        setPlayers(updatedPlayers);
        toast.success("Player restored successfully");
        localStorage.setItem('players_data_updated', Date.now().toString());
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to restore player");
      }
    } catch (error) {
      console.error('Restore player error:', error);
      toast.error("Something went wrong. Please try again.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-semibold">Manage Players</h3>
          <p className="text-muted-foreground">Add, edit, and manage team players</p>
        </div>
        <Dialog open={showPlayerForm} onOpenChange={setShowPlayerForm}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Add Player
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Player</DialogTitle>
              <DialogDescription>
                Add a new player to the team roster
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={playerForm.name}
                  onChange={(e) => setPlayerForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter player name"
                />
              </div>
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={playerForm.email}
                  onChange={(e) => setPlayerForm(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Enter email address"
                />
              </div>
              <div>
                <Label htmlFor="jersey">Jersey Number *</Label>
                <Input
                  id="jersey"
                  value={playerForm.jerseyNumber}
                  onChange={(e) => setPlayerForm(prev => ({ ...prev, jerseyNumber: e.target.value }))}
                  placeholder="Enter jersey number"
                />
              </div>
              <div>
                <Label htmlFor="position">Position</Label>
                <Select 
                  value={playerForm.position} 
                  onValueChange={(value) => setPlayerForm(prev => ({ ...prev, position: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select position" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="goalkeeper">Goalkeeper</SelectItem>
                    <SelectItem value="defender">Defender</SelectItem>
                    <SelectItem value="midfielder">Midfielder</SelectItem>
                    <SelectItem value="forward">Forward</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowPlayerForm(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddPlayer} disabled={isSubmitting}>
                {isSubmitting ? "Adding..." : "Add Player"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Players ({showDeletedPlayers ? players.length : activePlayers.length})
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDeletedPlayers(!showDeletedPlayers)}
              className="flex items-center gap-2"
            >
              {showDeletedPlayers ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {showDeletedPlayers ? 'Hide Deleted' : 'Show Deleted'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Player</TableHead>
                <TableHead>Jersey #</TableHead>
                <TableHead>Position</TableHead>
                <TableHead>Total Fines</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {players
                .filter(player => showDeletedPlayers || !player.deletedAt)
                .map((player) => (
                  <TableRow key={player.id} className={player.deletedAt ? "opacity-50" : ""}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                          <span className="text-xs font-medium">
                            {player.name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium">{player.name}</span>
                          <div className="text-xs text-muted-foreground">{player.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">#{player.jerseyNumber}</Badge>
                    </TableCell>
                    <TableCell>{player.position}</TableCell>
                    <TableCell>
                      <Badge variant="destructive" className="font-mono">
                        ₹{player.totalFines || 0}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {player.deletedAt ? (
                        <Badge variant="outline">Deleted</Badge>
                      ) : (
                        <Badge variant="default">Active</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {!player.deletedAt ? (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Player</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete {player.name}? 
                                  This will soft delete the player and they can be restored later.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleSoftDeletePlayer(player.id)}>
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRestorePlayer(player.id)}
                            className="flex items-center gap-2"
                          >
                            <RotateCcw className="h-4 w-4" />
                            Restore
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
          {players.length === 0 && (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No players found</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Deleted Players */}
      {showDeletedPlayers && deletedPlayers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-muted-foreground">
              <Undo2 className="h-5 w-5" />
              Deleted Players ({deletedPlayers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Jersey</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deletedPlayers.map((player) => (
                  <TableRow key={player.id} className="opacity-75">
                    <TableCell>
                      <div>
                        <p className="font-medium">{player.name}</p>
                        <p className="text-sm text-muted-foreground">{player.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>#{player.jerseyNumber}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{player.position}</Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRestorePlayer(player.id)}
                        className="flex items-center gap-2"
                      >
                        <Undo2 className="h-4 w-4" />
                        Restore
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface ManageFineReasonsTabProps {
  fineReasons: FineReason[];
  setFineReasons: (reasons: FineReason[]) => void;
  showDeletedReasons: boolean;
  setShowDeletedReasons: (show: boolean) => void;
}

function ManageFineReasonsTab({ fineReasons, setFineReasons, showDeletedReasons, setShowDeletedReasons }: ManageFineReasonsTabProps) {
  const [showReasonForm, setShowReasonForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reasonForm, setReasonForm] = useState({
    name: '',
    defaultAmount: 0,
    description: ''
  });

  const handleAddReason = async () => {
    if (!reasonForm.name || reasonForm.defaultAmount <= 0) {
      toast.error("Please provide a valid name and amount");
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('bearer_token');
      const response = await fetch('/api/fine-reasons', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reason: reasonForm.name,
          default_amount: reasonForm.defaultAmount,
          description: reasonForm.description
        }),
      });

      if (response.ok) {
        const newReason = await response.json();
        const transformedReason: FineReason = {
          id: newReason.id,
          name: newReason.name,
          defaultAmount: newReason.defaultAmount,
          description: newReason.description,
          deletedAt: newReason.deletedAt,
          usageCount: newReason.usageCount
        };
        setFineReasons([...fineReasons, transformedReason]);
        setReasonForm({ name: '', defaultAmount: 0, description: '' });
        setShowReasonForm(false);
        toast.success("Fine reason added successfully");
        localStorage.setItem('fine_reasons_data_updated', Date.now().toString());
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to add fine reason");
      }
    } catch (error) {
      console.error('Add fine reason error:', error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteReason = async (reasonId: number) => {
    try {
      const token = localStorage.getItem('bearer_token');
      const response = await fetch(`/api/fine-reasons/${reasonId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const updatedReasons = fineReasons.map(r => 
          r.id === reasonId ? { ...r, deletedAt: new Date().toISOString() } : r
        );
        setFineReasons(updatedReasons);
        toast.success("Fine reason deleted successfully");
        localStorage.setItem('fine_reasons_data_updated', Date.now().toString());
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to delete fine reason");
      }
    } catch (error) {
      console.error('Delete fine reason error:', error);
      toast.error("Something went wrong. Please try again.");
    }
  };

  const handleRestoreReason = async (reasonId: number) => {
    try {
      const token = localStorage.getItem('bearer_token');
      const response = await fetch(`/api/fine-reasons/${reasonId}/restore`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const updatedReasons = fineReasons.map(r => 
          r.id === reasonId ? { ...r, deletedAt: undefined } : r
        );
        setFineReasons(updatedReasons);
        toast.success("Fine reason restored successfully");
        localStorage.setItem('fine_reasons_data_updated', Date.now().toString());
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to restore fine reason");
      }
    } catch (error) {
      console.error('Restore fine reason error:', error);
      toast.error("Something went wrong. Please try again.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-semibold">Manage Fine Reasons</h3>
          <p className="text-muted-foreground">Configure fine types and default amounts</p>
        </div>
        <Dialog open={showReasonForm} onOpenChange={setShowReasonForm}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Fine Reason
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Fine Reason</DialogTitle>
              <DialogDescription>
                Create a new fine reason with default amount
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="reasonName">Reason Name *</Label>
                <Input
                  id="reasonName"
                  value={reasonForm.name}
                  onChange={(e) => setReasonForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Late to Training"
                />
              </div>
              <div>
                <Label htmlFor="defaultAmount">Default Amount (₹) *</Label>
                <Input
                  id="defaultAmount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={reasonForm.defaultAmount}
                  onChange={(e) => setReasonForm(prev => ({ ...prev, defaultAmount: Number(e.target.value) }))}
                  placeholder="25"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={reasonForm.description}
                  onChange={(e) => setReasonForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe when this fine applies"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowReasonForm(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddReason} disabled={isSubmitting}>
                {isSubmitting ? "Adding..." : "Add Reason"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Fine Reasons ({showDeletedReasons ? fineReasons.length : fineReasons.filter(r => !r.deletedAt).length})
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDeletedReasons(!showDeletedReasons)}
              className="flex items-center gap-2"
            >
              {showDeletedReasons ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {showDeletedReasons ? 'Hide Deleted' : 'Show Deleted'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reason</TableHead>
                <TableHead>Default Amount</TableHead>
                <TableHead>Usage Count</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fineReasons
                .filter(reason => showDeletedReasons || !reason.deletedAt)
                .map((reason) => (
                  <TableRow key={reason.id} className={reason.deletedAt ? "opacity-50" : ""}>
                    <TableCell>
                      <div>
                        <span className="font-medium">{reason.name}</span>
                        {reason.description && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {reason.description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-mono">
                        ₹{reason.defaultAmount}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {reason.usageCount || 0} times
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {reason.deletedAt ? (
                        <Badge variant="outline">Deleted</Badge>
                      ) : (
                        <Badge variant="default">Active</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {!reason.deletedAt ? (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Fine Reason</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{reason.name}"? 
                                  This will soft delete the reason and it can be restored later.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteReason(reason.id)}>
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRestoreReason(reason.id)}
                            className="flex items-center gap-2"
                          >
                            <RotateCcw className="h-4 w-4" />
                            Restore
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
          {fineReasons.length === 0 && (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No fine reasons found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface ManageUsersTabProps {
  users: UserRole[];
  setUsers: (users: UserRole[]) => void;
}

function ManageUsersTab({ users, setUsers }: ManageUsersTabProps) {
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showPromoteConfirm, setShowPromoteConfirm] = useState<UserRole | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'viewer' as 'viewer' | 'admin' | 'superadmin'
  });

  // Group users by role for better organization
  const usersByRole = {
    super_admin: users.filter(u => u.role === 'superadmin'),
    admin: users.filter(u => u.role === 'admin'),
    viewer: users.filter(u => u.role === 'viewer')
  };

  const handleAddUser = async () => {
    if (!userForm.name || !userForm.email || !userForm.password || !userForm.role) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Check if user with this email already exists
    const existingUser = users.find(u => u.email.toLowerCase() === userForm.email.toLowerCase());
    if (existingUser) {
      toast.error("User with this email already exists");
      return;
    }

    // Special handling for super admin role
    if (userForm.role === 'superadmin') {
      const currentSuperAdmin = users.find(u => u.role === 'superadmin');
      if (currentSuperAdmin) {
        toast.error("Only one Super Admin can exist. Please demote the current Super Admin first.");
        return;
      }
    }

    setIsUpdating(true);
    try {
      const token = localStorage.getItem('bearer_token');
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: userForm.name,
          email: userForm.email,
          password: userForm.password,
          role: userForm.role
        }),
      });

      if (response.ok) {
        const newUser = await response.json();
        setUsers([...users, {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          createdAt: newUser.createdAt,
          isActive: newUser.isActive,
          lastLoginAt: newUser.lastLoginAt
        }]);
        setUserForm({ name: '', email: '', password: '', role: 'viewer' });
        setShowAddUserModal(false);
        
        const roleDisplay = userForm.role === 'superadmin' ? 'Super Admin' : 
                           userForm.role === 'admin' ? 'Admin' : 'Viewer';
        toast.success(`User added successfully with ${roleDisplay} access`);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to add user');
      }
    } catch (error) {
      console.error('Add user error:', error);
      toast.error('Failed to add user');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdateUserRole = async (userId: number, newRole: 'viewer' | 'admin' | 'superadmin') => {
    if (newRole === 'superadmin') {
      const user = users.find(u => u.id === userId);
      if (user) {
        setShowPromoteConfirm(user);
      }
      return;
    }

    setIsUpdating(true);
    try {
      const token = localStorage.getItem('bearer_token');
      const response = await fetch(`/api/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole }),
      });

      if (response.ok) {
        const updatedUsers = users.map(u => 
          u.id === userId ? { ...u, role: newRole } : u
        );
        setUsers(updatedUsers);
        const roleDisplay = newRole === 'admin' ? 'Admin' : 'Viewer';
        toast.success(`User role updated to ${roleDisplay}`);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to update user role');
      }
    } catch (error) {
      console.error('Role change error:', error);
      toast.error('Failed to update user role');
    } finally {
      setIsUpdating(false);
    }
  };

  const confirmSuperAdminPromotion = async () => {
    if (!showPromoteConfirm) return;

    setIsUpdating(true);
    try {
      const token = localStorage.getItem('bearer_token');
      const response = await fetch(`/api/users/${showPromoteConfirm.id}/role`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: 'superadmin' }),
      });

      if (response.ok) {
        // Update local state - demote current super admin and promote new one
        const updatedUsers = users.map(u => {
          if (u.role === 'superadmin' && u.id !== showPromoteConfirm.id) {
            return { ...u, role: 'admin' as const };
          }
          if (u.id === showPromoteConfirm.id) {
            return { ...u, role: 'superadmin' as const };
          }
          return u;
        });

        setUsers(updatedUsers);
        setShowPromoteConfirm(null);
        toast.success(`${showPromoteConfirm.name} is now the Super Admin`);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to update super admin');
      }
    } catch (error) {
      console.error('Super admin promotion error:', error);
      toast.error('Failed to update super admin');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleToggleUserStatus = async (userId: number, isActive: boolean) => {
    setIsUpdating(true);
    try {
      const token = localStorage.getItem('bearer_token');
      const response = await fetch(`/api/users/${userId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: isActive }),
      });

      if (response.ok) {
        const updatedUsers = users.map(u => 
          u.id === userId ? { ...u, isActive: isActive } : u
        );
        setUsers(updatedUsers);
        toast.success(`User status updated to ${isActive ? 'Active' : 'Inactive'}`);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to update user status');
      }
    } catch (error) {
      console.error('User status update error:', error);
      toast.error('Failed to update user status');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-semibold">Manage Users</h3>
          <p className="text-muted-foreground">Manage user accounts and permissions</p>
        </div>
        <Dialog open={showAddUserModal} onOpenChange={setShowAddUserModal}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New User</DialogTitle>
              <DialogDescription>
                Create a new user account with appropriate role
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="userName">Name *</Label>
                  <Input
                    id="userName"
                    value={userForm.name}
                    onChange={(e) => setUserForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Full name"
                  />
                </div>
                <div>
                  <Label htmlFor="userEmail">Email *</Label>
                  <Input
                    id="userEmail"
                    type="email"
                    value={userForm.email}
                    onChange={(e) => setUserForm(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="user@example.com"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="userPassword">Password *</Label>
                  <Input
                    id="userPassword"
                    type="password"
                    value={userForm.password}
                    onChange={(e) => setUserForm(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="Password"
                  />
                </div>
                <div>
                  <Label htmlFor="userRole">Role *</Label>
                  <Select 
                    value={userForm.role} 
                    onValueChange={(value: 'viewer' | 'admin' | 'superadmin') => 
                      setUserForm(prev => ({ ...prev, role: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="viewer">Viewer</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      {usersByRole.super_admin.length === 0 && (
                        <SelectItem value="superadmin">Super Admin</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddUserModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddUser} disabled={isUpdating}>
                {isUpdating ? "Adding..." : "Add User"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            System Users ({users.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Active</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                        <span className="text-xs font-medium">
                          {user.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium">{user.name}</span>
                        <div className="text-xs text-muted-foreground">{user.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {user.role === 'superadmin' && <Crown className="h-4 w-4 text-yellow-500" />}
                      {user.role === 'admin' && <Shield className="h-4 w-4 text-blue-500" />}
                      {user.role === 'viewer' && <Eye className="h-4 w-4 text-gray-500" />}
                      <Badge 
                        variant={
                          user.role === 'superadmin' ? 'default' : 
                          user.role === 'admin' ? 'secondary' : 
                          'outline'
                        }
                      >
                        {user.role === 'superadmin' ? 'Super Admin' : 
                         user.role === 'admin' ? 'Admin' : 
                         'Viewer'}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.isActive ? 'default' : 'secondary'}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Never'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Select
                        value={user.role}
                        onValueChange={(newRole) => handleUpdateUserRole(user.id, newRole)}
                        disabled={isUpdating}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="viewer">Viewer</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="superadmin">Super Admin</SelectItem>
                        </SelectContent>
                      </Select>
                      {user.role !== 'superadmin' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleUserStatus(user.id, !user.isActive)}
                        >
                          {user.isActive ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {users.length === 0 && (
            <div className="text-center py-8">
              <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No users found</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Role Permissions Reference */}
      <Card>
        <CardHeader>
          <CardTitle>Role Permissions Reference</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium text-destructive">Super Admin</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Full system access</li>
                <li>• Manage all users & roles</li>
                <li>• Access audit logs</li>
                <li>• System configuration</li>
                <li>• Manage players & fines</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-primary">Admin</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Manage players</li>
                <li>• Add & edit fines</li>
                <li>• Manage fine reasons</li>
                <li>• View reports</li>
                <li>• Export data</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-muted-foreground">Viewer</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• View fines only</li>
                <li>• View reports</li>
                <li>• Export data</li>
                <li>• No editing permissions</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Super Admin Promotion Confirmation */}
      <AlertDialog open={!!showPromoteConfirm} onOpenChange={(open) => {
        if (!open) setShowPromoteConfirm(null);
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Assign Super Admin Role</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to make {showPromoteConfirm?.name} the Super Admin? 
              This will demote the current Super Admin to Admin role. Only one Super Admin can exist at a time.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUpdating}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmSuperAdminPromotion}
              disabled={isUpdating}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isUpdating ? 'Updating...' : 'Confirm Assignment'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function CustomizationTab({ 
  systemConfig, 
  setSystemConfig 
}: {
  systemConfig: SystemConfig;
  setSystemConfig: (config: SystemConfig) => void;
}) {
  const [tempConfig, setTempConfig] = useState(systemConfig);

  const handleSave = () => {
    setSystemConfig(tempConfig);
    toast.success("Settings saved successfully");
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-display font-bold">Customization</h2>
        <p className="text-muted-foreground">Configure app settings and branding</p>
      </div>

      <div className="grid gap-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Currency Settings</CardTitle>
            <CardDescription>
              Choose the currency symbol for displaying fines
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="currency">Currency Symbol</Label>
              <Select 
                value={tempConfig.currency} 
                onValueChange={(value) => setTempConfig(prev => ({ ...prev, currency: value }))}
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
            <CardTitle>Fine Frequency</CardTitle>
            <CardDescription>
              Set how often fines are collected and reset
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="frequency">Collection Frequency</Label>
              <Select 
                value={tempConfig.fineFrequency} 
                onValueChange={(value: 'match' | 'week' | 'season') => 
                  setTempConfig(prev => ({ ...prev, fineFrequency: value }))}
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
            <CardTitle>Branding</CardTitle>
            <CardDescription>
              Customize the app name and branding
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="app-name">App Name</Label>
              <Input
                id="app-name"
                value={tempConfig.appName}
                onChange={(e) => setTempConfig(prev => ({ ...prev, appName: e.target.value }))}
                placeholder="CCL Fines"
              />
            </div>
            <div>
              <Label htmlFor="logo-url">Logo URL (optional)</Label>
              <Input
                id="logo-url"
                value={tempConfig.logoUrl || ''}
                onChange={(e) => setTempConfig(prev => ({ ...prev, logoUrl: e.target.value }))}
                placeholder="https://example.com/logo.png"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={handleSave}>
            Save Settings
          </Button>
        </div>
      </div>
    </div>
  );
}

function AuditTab({ auditLog }: { auditLog: AuditEntry[] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState<string>('all');
  
  const filteredLog = useMemo(() => {
    return auditLog.filter(entry => {
      const matchesSearch = entry.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          entry.details.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesAction = filterAction === 'all' || entry.action === filterAction;
      
      return matchesSearch && matchesAction;
    });
  }, [auditLog, searchTerm, filterAction]);

  const exportLog = () => {
    // Mock export functionality
    toast.success("Audit log exported successfully");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold">Audit Log</h2>
          <p className="text-muted-foreground">Immutable log of all system actions (Super Admin only)</p>
        </div>
        <Button onClick={exportLog} variant="outline">
          Export CSV
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ScrollText className="h-5 w-5" />
            System Activity Log
          </CardTitle>
          <div className="flex gap-4 mt-4">
            <div className="flex-1">
              <Input
                placeholder="Search by user or details..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={filterAction} onValueChange={setFilterAction}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="add">Add</SelectItem>
                <SelectItem value="edit">Edit</SelectItem>
                <SelectItem value="delete">Delete</SelectItem>
                <SelectItem value="restore">Restore</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Fine ID</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLog.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="font-mono text-sm">
                    {new Date(entry.timestamp).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={
                        entry.action === 'delete' ? 'destructive' :
                        entry.action === 'add' ? 'default' :
                        entry.action === 'restore' ? 'secondary' : 'outline'
                      }
                    >
                      {entry.action.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>{entry.userEmail}</TableCell>
                  <TableCell className="font-mono">
                    {entry.fineId || '-'}
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {entry.details}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredLog.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No audit entries found matching your criteria
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function InfoTab() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-display font-bold">Information</h2>
        <p className="text-muted-foreground">League rules, app version, and support information</p>
      </div>

      <div className="grid gap-6 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle>League Rules</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="prose prose-sm max-w-none">
              <h4>Fine System Rules</h4>
              <ul className="space-y-2">
                <li>All fines must be paid before the next match</li>
                <li>Repeated offenses may result in increased penalties</li>
                <li>Players can appeal fines within 24 hours of issuance</li>
                <li>Fine proceeds go to the team social fund</li>
                <li>Payment can be made via cash or team account transfer</li>
              </ul>
              
              <h4>Common Violations</h4>
              <ul className="space-y-2">
                <li><strong>Late to Training:</strong> Arriving more than 15 minutes after start time</li>
                <li><strong>Missed Practice:</strong> Absence without 24-hour notice</li>
                <li><strong>Equipment Issues:</strong> Forgetting boots, shin pads, or uniform</li>
                <li><strong>Behavioral:</strong> Unsporting conduct during games or training</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>App Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Current Version</Label>
                <p className="text-2xl font-bold">v2.1.3</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Last Updated</Label>
                <p className="text-sm text-muted-foreground">January 20, 2024</p>
              </div>
            </div>
            
            <Separator />
            
            <div>
              <h4 className="text-sm font-medium mb-2">Recent Changes (v2.1.3)</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Added CSV import functionality for players</li>
                <li>• Improved audit log filtering and export</li>
                <li>• Enhanced role management with confirmations</li>
                <li>• Fixed mobile responsive issues</li>
                <li>• Added soft delete with restore capability</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Support & Contact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Technical Support</Label>
              <p className="text-sm text-muted-foreground">support@cclfines.com</p>
            </div>
            <div>
              <Label className="text-sm font-medium">League Administrator</Label>
              <p className="text-sm text-muted-foreground">admin@ccl.com</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Emergency Contact</Label>
              <p className="text-sm text-muted-foreground">+1 (555) 123-4567</p>
            </div>
            
            <Separator />
            
            <div>
              <h4 className="text-sm font-medium mb-2">Useful Links</h4>
              <div className="space-y-2">
                <Button variant="link" className="p-0 h-auto text-sm">
                  User Manual & FAQ
                </Button>
                <Button variant="link" className="p-0 h-auto text-sm">
                  Privacy Policy
                </Button>
                <Button variant="link" className="p-0 h-auto text-sm">
                  Terms of Service
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}