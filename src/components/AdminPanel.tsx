"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { 
  User, 
  UserCog, 
  UserRoundPlus, 
  Logs, 
  LayoutDashboard,
  ChevronRight,
  Undo,
  PanelRightOpen,
  Users,
  Plus,
  Edit
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
}

interface UserRole {
  id: number;
  email: string;
  name: string;
  role: 'viewer' | 'admin' | 'super_admin';
  avatarUrl?: string;
  createdAt: string;
}

interface AuditEntry {
  id: number;
  fineId?: number;
  action: 'add' | 'edit' | 'delete' | 'restore';
  userEmail: string;
  timestamp: string;
  details: string;
}

interface SystemConfig {
  currency: string;
  fineFrequency: 'match' | 'week' | 'season';
  appName: string;
  logoUrl?: string;
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
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);

  // Loading states
  const [isLoading, setIsLoading] = useState(true);

  // Fetch all data on mount
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const session = JSON.parse(localStorage.getItem('better-auth-session') || '{}');
        const token = session.token;
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

          // Fetch audit log
          const auditResponse = await fetch('/api/audit-logs', { headers });
          if (auditResponse.ok) {
            const auditData = await auditResponse.json();
            setAuditLog(Array.isArray(auditData) ? auditData : []);
          } else {
            setAuditLog([]);
          }
        } else {
          // Ensure users is always an array for non-superadmin users
          setUsers([]);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load admin data');
        // Ensure all arrays are properly initialized even on error
        setPlayers([]);
        setFineReasons([]);
        setUsers([]);
        setAuditLog([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [userRole]);

  // Filter functions
  const activePlayers = players.filter(player => !player.deletedAt);
  const deletedPlayers = players.filter(player => player.deletedAt);
  const activeReasons = fineReasons.filter(reason => !reason.deletedAt);

  const canAccessTab = (tab: string) => {
    if (tab === 'manage-users' || tab === 'audit') {
      return userRole === 'superadmin';
    }
    return true;
  };

  const tabs = [
    { id: 'players', label: 'Players', icon: User },
    { id: 'reasons', label: 'Fine Reasons', icon: LayoutDashboard },
    { id: 'manage-users', label: 'Manage Users', icon: Users, superAdminOnly: true },
    { id: 'audit', label: 'Audit Log', icon: Logs, superAdminOnly: true },
    { id: 'info', label: 'Info', icon: PanelRightOpen },
  ].filter(tab => canAccessTab(tab.id));

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

  return (
    <div className="w-full max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold">Admin Panel</h1>
          <p className="text-muted-foreground">Manage players, fine reasons, and system administration</p>
        </div>
        <Badge variant="secondary" className="text-sm">
          {userRole === 'superadmin' ? 'Super Admin' : 'Admin'}
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-5 h-auto p-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <TabsTrigger 
                key={tab.id} 
                value={tab.id}
                className="flex flex-col items-center gap-1 p-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Icon className="h-4 w-4" />
                <span className="text-xs font-medium">{tab.label}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value="players">
          <PlayersTab 
            players={players} 
            setPlayers={setPlayers}
            activePlayers={activePlayers}
            deletedPlayers={deletedPlayers}
            userRole={userRole}
          />
        </TabsContent>

        <TabsContent value="reasons">
          <ReasonsTab 
            fineReasons={fineReasons}
            setFineReasons={setFineReasons}
            activeReasons={activeReasons}
            userRole={userRole}
          />
        </TabsContent>

        {canAccessTab('manage-users') && (
          <TabsContent value="manage-users">
            <ManageUsersTab 
              users={users}
              setUsers={setUsers}
              currentUserRole={userRole}
            />
          </TabsContent>
        )}

        {canAccessTab('audit') && (
          <TabsContent value="audit">
            <AuditTab auditLog={auditLog} />
          </TabsContent>
        )}

        <TabsContent value="info">
          <InfoTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function PlayersTab({ 
  players, 
  setPlayers, 
  activePlayers, 
  deletedPlayers, 
  userRole 
}: {
  players: Player[];
  setPlayers: (players: Player[]) => void;
  activePlayers: Player[];
  deletedPlayers: Player[];
  userRole: 'admin' | 'super_admin';
}) {
  const [showPlayerForm, setShowPlayerForm] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showDeletedPlayers, setShowDeletedPlayers] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);

  const [playerForm, setPlayerForm] = useState({
    name: '',
    email: '',
    jerseyNumber: '',
    position: ''
  });

  const handleAddPlayer = () => {
    if (!playerForm.name || !playerForm.email || !playerForm.jerseyNumber) {
      toast.error("Please fill in all required fields");
      return;
    }

    const newPlayer: Player = {
      id: Date.now(),
      name: playerForm.name,
      email: playerForm.email,
      jerseyNumber: playerForm.jerseyNumber,
      position: playerForm.position,
      totalFines: 0,
      deletedAt: undefined,
      createdAt: new Date().toISOString().split('T')[0]
    };

    setPlayers([...players, newPlayer]);
    setPlayerForm({ name: '', email: '', jerseyNumber: '', position: '' });
    setShowPlayerForm(false);
    toast.success("Player added successfully");
  };

  const handleEditPlayer = () => {
    if (!editingPlayer) return;
    
    const updatedPlayers = players.map(p => 
      p.id === editingPlayer.id ? editingPlayer : p
    );
    setPlayers(updatedPlayers);
    setEditingPlayer(null);
    toast.success("Player updated successfully");
  };

  const handleSoftDeletePlayer = (playerId: number) => {
    const updatedPlayers = players.map(p => 
      p.id === playerId ? { ...p, deletedAt: new Date().toISOString() } : p
    );
    setPlayers(updatedPlayers);
    toast.success("Player deleted successfully");
  };

  const handleRestorePlayer = (playerId: number) => {
    const updatedPlayers = players.map(p => 
      p.id === playerId ? { ...p, deletedAt: undefined } : p
    );
    setPlayers(updatedPlayers);
    toast.success("Player restored successfully");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold">Players Management</h2>
          <p className="text-muted-foreground">Add, edit, and manage team players</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setShowDeletedPlayers(!showDeletedPlayers)}
            className="flex items-center gap-2"
          >
            <Undo className="h-4 w-4" />
            {showDeletedPlayers ? 'Hide Deleted' : 'Show Deleted'}
          </Button>
          <Dialog open={showImportModal} onOpenChange={setShowImportModal}>
            <DialogTrigger asChild>
              <Button variant="outline">Import CSV</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Import Players from CSV</DialogTitle>
                <DialogDescription>
                  Upload a CSV file with player data. Required columns: Name, Email, Jersey, Position
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <Input type="file" accept=".csv" />
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm font-medium mb-2">CSV Preview:</p>
                  <pre className="text-xs text-muted-foreground">
{`Name,Email,Jersey,Position
John Doe,john@example.com,10,Forward
Jane Smith,jane@example.com,7,Midfielder`}
                  </pre>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowImportModal(false)}>
                  Cancel
                </Button>
                <Button onClick={() => {
                  setShowImportModal(false);
                  toast.success("CSV import completed successfully");
                }}>
                  Import Players
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Dialog open={showPlayerForm} onOpenChange={setShowPlayerForm}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <UserRoundPlus className="h-4 w-4" />
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
                <Button onClick={handleAddPlayer}>Add Player</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Active Players */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Active Players ({activePlayers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Jersey</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Total Fines</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activePlayers.map((player) => (
                  <TableRow key={player.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{player.name}</p>
                        <p className="text-sm text-muted-foreground">{player.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>#{player.jerseyNumber}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{player.position}</Badge>
                    </TableCell>
                    <TableCell>${player.totalFines || 0}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Sheet>
                          <SheetTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setSelectedPlayer(player)}
                            >
                              View Details
                            </Button>
                          </SheetTrigger>
                          <SheetContent className="w-[400px] sm:w-[540px]">
                            <SheetHeader>
                              <SheetTitle>{player.name}</SheetTitle>
                              <SheetDescription>
                                Player details and fine history
                              </SheetDescription>
                            </SheetHeader>
                            <div className="mt-6 space-y-6">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label className="text-sm font-medium">Jersey</Label>
                                  <p className="text-sm text-muted-foreground">#{player.jerseyNumber}</p>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium">Position</Label>
                                  <p className="text-sm text-muted-foreground">{player.position}</p>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium">Total Fines</Label>
                                  <p className="text-sm font-medium text-destructive">${player.totalFines || 0}</p>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium">Joined</Label>
                                  <p className="text-sm text-muted-foreground">{player.createdAt}</p>
                                </div>
                              </div>
                              <Separator />
                              <div>
                                <h4 className="text-sm font-medium mb-3">Fine History</h4>
                                <div className="space-y-3">
                                  <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                                    <div>
                                      <p className="text-sm font-medium">Late to Training</p>
                                      <p className="text-xs text-muted-foreground">2024-01-18</p>
                                    </div>
                                    <Badge variant="destructive">$25</Badge>
                                  </div>
                                  <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                                    <div>
                                      <p className="text-sm font-medium">Missed Practice</p>
                                      <p className="text-xs text-muted-foreground">2024-01-15</p>
                                    </div>
                                    <Badge variant="destructive">$50</Badge>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </SheetContent>
                        </Sheet>
                        <Dialog open={editingPlayer?.id === player.id} onOpenChange={(open) => {
                          if (!open) setEditingPlayer(null);
                          else setEditingPlayer(player);
                        }}>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              Edit
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Edit Player</DialogTitle>
                            </DialogHeader>
                            {editingPlayer && (
                              <div className="space-y-4">
                                <div>
                                  <Label>Name</Label>
                                  <Input
                                    value={editingPlayer.name}
                                    onChange={(e) => setEditingPlayer(prev => 
                                      prev ? { ...prev, name: e.target.value } : null
                                    )}
                                  />
                                </div>
                                <div>
                                  <Label>Email</Label>
                                  <Input
                                    value={editingPlayer.email}
                                    onChange={(e) => setEditingPlayer(prev => 
                                      prev ? { ...prev, email: e.target.value } : null
                                    )}
                                  />
                                </div>
                                <div>
                                  <Label>Jersey</Label>
                                  <Input
                                    value={editingPlayer.jerseyNumber}
                                    onChange={(e) => setEditingPlayer(prev => 
                                      prev ? { ...prev, jerseyNumber: e.target.value } : null
                                    )}
                                  />
                                </div>
                                <div>
                                  <Label>Position</Label>
                                  <Select 
                                    value={editingPlayer.position} 
                                    onValueChange={(value) => setEditingPlayer(prev => 
                                      prev ? { ...prev, position: value } : null
                                    )}
                                  >
                                    <SelectTrigger>
                                      <SelectValue />
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
                            )}
                            <DialogFooter>
                              <Button variant="outline" onClick={() => setEditingPlayer(null)}>
                                Cancel
                              </Button>
                              <Button onClick={handleEditPlayer}>Save Changes</Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              Delete
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Player</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete {player.name}? This will soft-delete the player and they can be restored later.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleSoftDeletePlayer(player.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Deleted Players */}
        {showDeletedPlayers && deletedPlayers.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-muted-foreground">
                <Undo className="h-5 w-5" />
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
                          <Undo className="h-4 w-4" />
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
    </div>
  );
}

function ReasonsTab({ 
  fineReasons, 
  setFineReasons, 
  activeReasons, 
  userRole 
}: {
  fineReasons: FineReason[];
  setFineReasons: (reasons: FineReason[]) => void;
  activeReasons: FineReason[];
  userRole: 'admin' | 'super_admin';
}) {
  const [showReasonForm, setShowReasonForm] = useState(false);
  const [editingReason, setEditingReason] = useState<FineReason | null>(null);
  const [reasonForm, setReasonForm] = useState({
    name: '',
    defaultAmount: 0,
    description: ''
  });

  const handleAddReason = () => {
    if (!reasonForm.name || reasonForm.defaultAmount <= 0) {
      toast.error("Please provide a valid name and amount");
      return;
    }

    const newReason: FineReason = {
      id: Date.now(),
      name: reasonForm.name,
      defaultAmount: reasonForm.defaultAmount,
      description: reasonForm.description,
      deletedAt: undefined
    };

    setFineReasons([...fineReasons, newReason]);
    setReasonForm({ name: '', defaultAmount: 0, description: '' });
    setShowReasonForm(false);
    toast.success("Fine reason added successfully");
  };

  const handleEditReason = () => {
    if (!editingReason) return;
    
    const updatedReasons = fineReasons.map(r => 
      r.id === editingReason.id ? editingReason : r
    );
    setFineReasons(updatedReasons);
    setEditingReason(null);
    toast.success("Fine reason updated successfully");
  };

  const handleDeleteReason = (reasonId: number) => {
    const updatedReasons = fineReasons.map(r => 
      r.id === reasonId ? { ...r, deletedAt: new Date().toISOString() } : r
    );
    setFineReasons(updatedReasons);
    toast.success("Fine reason deleted successfully");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold">Fine Reasons</h2>
          <p className="text-muted-foreground">Manage fine types and their default amounts</p>
        </div>
        <Dialog open={showReasonForm} onOpenChange={setShowReasonForm}>
          <DialogTrigger asChild>
            <Button>Add Fine Reason</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Fine Reason</DialogTitle>
              <DialogDescription>
                Create a new fine reason with a default amount
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="reason-name">Reason Name *</Label>
                <Input
                  id="reason-name"
                  value={reasonForm.name}
                  onChange={(e) => setReasonForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Late to Training"
                />
              </div>
              <div>
                <Label htmlFor="reason-amount">Default Amount ({systemConfig.currency}) *</Label>
                <Input
                  id="reason-amount"
                  type="number"
                  min="0"
                  value={reasonForm.defaultAmount}
                  onChange={(e) => setReasonForm(prev => ({ ...prev, defaultAmount: Number(e.target.value) }))}
                  placeholder="25"
                />
              </div>
              <div>
                <Label htmlFor="reason-description">Description</Label>
                <Textarea
                  id="reason-description"
                  value={reasonForm.description}
                  onChange={(e) => setReasonForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe when this fine applies"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowReasonForm(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddReason}>Add Reason</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active Fine Reasons ({activeReasons.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reason</TableHead>
                <TableHead>Default Amount</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activeReasons.map((reason) => (
                <TableRow key={reason.id}>
                  <TableCell>
                    <p className="font-medium">{reason.name}</p>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {systemConfig.currency}{reason.defaultAmount}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm text-muted-foreground">
                      {reason.description || 'No description'}
                    </p>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Dialog open={editingReason?.id === reason.id} onOpenChange={(open) => {
                        if (!open) setEditingReason(null);
                        else setEditingReason(reason);
                      }}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            Edit
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Edit Fine Reason</DialogTitle>
                          </DialogHeader>
                          {editingReason && (
                            <div className="space-y-4">
                              <div>
                                <Label>Reason Name</Label>
                                <Input
                                  value={editingReason.name}
                                  onChange={(e) => setEditingReason(prev => 
                                    prev ? { ...prev, name: e.target.value } : null
                                  )}
                                />
                              </div>
                              <div>
                                <Label>Default Amount ({systemConfig.currency})</Label>
                                <Input
                                  type="number"
                                  value={editingReason.defaultAmount}
                                  onChange={(e) => setEditingReason(prev => 
                                    prev ? { ...prev, defaultAmount: Number(e.target.value) } : null
                                  )}
                                />
                              </div>
                              <div>
                                <Label>Description</Label>
                                <Textarea
                                  value={editingReason.description || ''}
                                  onChange={(e) => setEditingReason(prev => 
                                    prev ? { ...prev, description: e.target.value } : null
                                  )}
                                />
                              </div>
                            </div>
                          )}
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setEditingReason(null)}>
                              Cancel
                            </Button>
                            <Button onClick={handleEditReason}>Save Changes</Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Fine Reason</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{reason.name}"? This action will soft-delete the reason.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleDeleteReason(reason.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function ManageUsersTab({ 
  users, 
  setUsers, 
  currentUserRole 
}: {
  users: UserRole[];
  setUsers: (users: UserRole[]) => void;
  currentUserRole: 'admin' | 'superadmin';
}) {
  const [showPromoteConfirm, setShowPromoteConfirm] = useState<UserRole | null>(null);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRole | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [userForm, setUserForm] = useState({
    email: '',
    role: 'viewer' as 'viewer' | 'admin'
  });

  const handleAddUser = async () => {
    if (!userForm.email || !userForm.role) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Check if user with this email already exists
    const existingUser = users.find(u => u.email.toLowerCase() === userForm.email.toLowerCase());
    if (existingUser) {
      toast.error("User with this email already exists");
      return;
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
          email: userForm.email,
          role: userForm.role,
          name: userForm.email.split('@')[0] // Use email prefix as default name
        }),
      });

      if (response.ok) {
        const newUser = await response.json();
        setUsers([...users, {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          role: newUser.role,
          createdAt: newUser.createdAt
        }]);
        setUserForm({ email: '', role: 'viewer' });
        setShowAddUserModal(false);
        toast.success(`User added successfully with ${userForm.role} access`);
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

  const handleRoleChange = async (userId: number, newRole: 'viewer' | 'admin' | 'super_admin') => {
    if (newRole === 'super_admin') {
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
        toast.success(`User role updated to ${newRole}`);
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
        body: JSON.stringify({ role: 'super_admin' }),
      });

      if (response.ok) {
        // Update local state - demote current super admin and promote new one
        const updatedUsers = users.map(u => {
          if (u.role === 'super_admin' && u.id !== showPromoteConfirm.id) {
            return { ...u, role: 'admin' as const };
          }
          if (u.id === showPromoteConfirm.id) {
            return { ...u, role: 'super_admin' as const };
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

  const handleEditUser = async () => {
    if (!editingUser) return;

    setIsUpdating(true);
    try {
      const token = localStorage.getItem('bearer_token');
      const response = await fetch(`/api/users/${editingUser.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editingUser.name,
          email: editingUser.email
        }),
      });

      if (response.ok) {
        const updatedUsers = users.map(u => 
          u.id === editingUser.id ? editingUser : u
        );
        setUsers(updatedUsers);
        setEditingUser(null);
        toast.success('User updated successfully');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to update user');
      }
    } catch (error) {
      console.error('Update user error:', error);
      toast.error('Failed to update user');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold">Manage Users</h2>
          <p className="text-muted-foreground">Manage user roles and permissions (Super Admin only)</p>
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
                Add a user by email and assign a role. The user must have already signed up to the system.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="user-email">Email Address *</Label>
                <Input
                  id="user-email"
                  type="email"
                  value={userForm.email}
                  onChange={(e) => setUserForm(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="user@example.com"
                />
              </div>
              <div>
                <Label htmlFor="user-role">Assign Role *</Label>
                <Select 
                  value={userForm.role} 
                  onValueChange={(value: 'viewer' | 'admin') => setUserForm(prev => ({ ...prev, role: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="viewer">Viewer</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddUserModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddUser} disabled={isUpdating}>
                {isUpdating ? 'Adding...' : 'Add User'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            User Roles & Permissions ({users.length} users)
          </CardTitle>
          <CardDescription>
            Control user access levels and permissions. Only Super Admin can manage user roles.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 p-4 bg-muted rounded-lg">
            <h4 className="font-medium mb-2">Role Permissions:</h4>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• <strong>Viewer:</strong> Can view & export fines and reports only</li>
              <li>• <strong>Admin:</strong> Can add fines, manage players & fine reasons. Cannot delete fines</li>
              <li>• <strong>Super Admin:</strong> Full control - manage everything including user roles</li>
            </ul>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Current Role</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={
                        user.role === 'super_admin' ? 'destructive' :
                        user.role === 'admin' ? 'default' : 'secondary'
                      }
                    >
                      {user.role === 'super_admin' ? 'Super Admin' :
                       user.role === 'admin' ? 'Admin' : 'Viewer'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Dialog open={editingUser?.id === user.id} onOpenChange={(open) => {
                        if (!open) setEditingUser(null);
                        else setEditingUser({ ...user });
                      }}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Edit User</DialogTitle>
                            <DialogDescription>
                              Update user information
                            </DialogDescription>
                          </DialogHeader>
                          {editingUser && (
                            <div className="space-y-4">
                              <div>
                                <Label>Name</Label>
                                <Input
                                  value={editingUser.name}
                                  onChange={(e) => setEditingUser(prev => 
                                    prev ? { ...prev, name: e.target.value } : null
                                  )}
                                />
                              </div>
                              <div>
                                <Label>Email</Label>
                                <Input
                                  value={editingUser.email}
                                  onChange={(e) => setEditingUser(prev => 
                                    prev ? { ...prev, email: e.target.value } : null
                                  )}
                                />
                              </div>
                            </div>
                          )}
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setEditingUser(null)}>
                              Cancel
                            </Button>
                            <Button onClick={handleEditUser} disabled={isUpdating}>
                              {isUpdating ? 'Saving...' : 'Save Changes'}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>

                      {user.role === 'viewer' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRoleChange(user.id, 'admin')}
                          disabled={isUpdating}
                        >
                          Promote to Admin
                        </Button>
                      )}
                      {user.role === 'admin' && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRoleChange(user.id, 'viewer')}
                            disabled={isUpdating}
                          >
                            Demote to Viewer
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRoleChange(user.id, 'super_admin')}
                            disabled={isUpdating}
                          >
                            Make Super Admin
                          </Button>
                        </>
                      )}
                      {user.role === 'super_admin' && (
                        <Badge variant="outline" className="text-xs">
                          Current Super Admin
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {users.length === 0 && (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No users found</p>
            </div>
          )}
        </CardContent>
      </Card>

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
            <Logs className="h-5 w-5" />
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