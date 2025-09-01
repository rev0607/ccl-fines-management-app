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
  SlidersVertical, 
  Logs, 
  LayoutDashboard,
  ChevronRight,
  Undo,
  PanelRightOpen
} from "lucide-react";
import { toast } from "sonner";

interface Player {
  id: string;
  name: string;
  email: string;
  jersey: string;
  position: string;
  totalFines: number;
  isDeleted: boolean;
  createdAt: string;
}

interface FineReason {
  id: string;
  name: string;
  defaultAmount: number;
  isDeleted: boolean;
  description?: string;
}

interface UserRole {
  id: string;
  email: string;
  name: string;
  role: 'viewer' | 'admin' | 'super_admin';
}

interface AuditEntry {
  id: string;
  fineId?: string;
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

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState("players");
  const [userRole, setUserRole] = useState<'admin' | 'super_admin'>('admin'); // Mock current user role
  
  // Mock data
  const [players, setPlayers] = useState<Player[]>([
    { id: '1', name: 'John Doe', email: 'john@example.com', jersey: '10', position: 'Forward', totalFines: 150, isDeleted: false, createdAt: '2024-01-15' },
    { id: '2', name: 'Jane Smith', email: 'jane@example.com', jersey: '7', position: 'Midfielder', totalFines: 75, isDeleted: false, createdAt: '2024-01-20' },
    { id: '3', name: 'Mike Wilson', email: 'mike@example.com', jersey: '3', position: 'Defender', totalFines: 200, isDeleted: true, createdAt: '2024-01-10' },
  ]);

  const [fineReasons, setFineReasons] = useState<FineReason[]>([
    { id: '1', name: 'Late to Training', defaultAmount: 25, isDeleted: false, description: 'Arriving more than 15 minutes late' },
    { id: '2', name: 'Missed Practice', defaultAmount: 50, isDeleted: false, description: 'Unexcused absence from team practice' },
    { id: '3', name: 'Equipment Violation', defaultAmount: 15, isDeleted: false, description: 'Incorrect or missing equipment' },
  ]);

  const [users, setUsers] = useState<UserRole[]>([
    { id: '1', email: 'admin@example.com', name: 'Admin User', role: 'admin' },
    { id: '2', email: 'super@example.com', name: 'Super Admin', role: 'super_admin' },
    { id: '3', email: 'viewer@example.com', name: 'Regular User', role: 'viewer' },
  ]);

  const [auditLog] = useState<AuditEntry[]>([
    { id: '1', fineId: 'F001', action: 'add', userEmail: 'admin@example.com', timestamp: '2024-01-20T10:30:00Z', details: 'Added fine for late arrival' },
    { id: '2', fineId: 'F002', action: 'edit', userEmail: 'super@example.com', timestamp: '2024-01-19T15:45:00Z', details: 'Updated fine amount from $25 to $30' },
    { id: '3', action: 'delete', userEmail: 'admin@example.com', timestamp: '2024-01-18T09:15:00Z', details: 'Soft deleted player Mike Wilson' },
  ]);

  const [systemConfig, setSystemConfig] = useState<SystemConfig>({
    currency: '$',
    fineFrequency: 'match',
    appName: 'CCL Fines',
  });

  // Filter functions
  const activeUsers = users.filter(user => user.role !== 'viewer' || userRole === 'super_admin');
  const activePlayers = players.filter(player => !player.isDeleted);
  const deletedPlayers = players.filter(player => player.isDeleted);
  const activeReasons = fineReasons.filter(reason => !reason.isDeleted);

  const canAccessTab = (tab: string) => {
    if (tab === 'roles' || tab === 'audit') {
      return userRole === 'super_admin';
    }
    return true;
  };

  const tabs = [
    { id: 'players', label: 'Players', icon: User },
    { id: 'reasons', label: 'Fine Reasons', icon: LayoutDashboard },
    { id: 'roles', label: 'Roles', icon: UserCog, superAdminOnly: true },
    { id: 'customization', label: 'Customization', icon: SlidersVertical },
    { id: 'audit', label: 'Audit Log', icon: Logs, superAdminOnly: true },
    { id: 'info', label: 'Info', icon: PanelRightOpen },
  ].filter(tab => canAccessTab(tab.id));

  return (
    <div className="w-full max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold">Admin Panel</h1>
          <p className="text-muted-foreground">Manage players, settings, and system configuration</p>
        </div>
        <Badge variant="secondary" className="text-sm">
          {userRole === 'super_admin' ? 'Super Admin' : 'Admin'}
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-6 h-auto p-1">
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
            systemConfig={systemConfig}
          />
        </TabsContent>

        {canAccessTab('roles') && (
          <TabsContent value="roles">
            <RolesTab 
              users={users}
              setUsers={setUsers}
              currentUserRole={userRole}
            />
          </TabsContent>
        )}

        <TabsContent value="customization">
          <CustomizationTab 
            systemConfig={systemConfig}
            setSystemConfig={setSystemConfig}
          />
        </TabsContent>

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
    jersey: '',
    position: ''
  });

  const handleAddPlayer = () => {
    if (!playerForm.name || !playerForm.email || !playerForm.jersey) {
      toast.error("Please fill in all required fields");
      return;
    }

    const newPlayer: Player = {
      id: Date.now().toString(),
      name: playerForm.name,
      email: playerForm.email,
      jersey: playerForm.jersey,
      position: playerForm.position,
      totalFines: 0,
      isDeleted: false,
      createdAt: new Date().toISOString().split('T')[0]
    };

    setPlayers([...players, newPlayer]);
    setPlayerForm({ name: '', email: '', jersey: '', position: '' });
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

  const handleSoftDeletePlayer = (playerId: string) => {
    const updatedPlayers = players.map(p => 
      p.id === playerId ? { ...p, isDeleted: true } : p
    );
    setPlayers(updatedPlayers);
    toast.success("Player deleted successfully");
  };

  const handleRestorePlayer = (playerId: string) => {
    const updatedPlayers = players.map(p => 
      p.id === playerId ? { ...p, isDeleted: false } : p
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
                    value={playerForm.jersey}
                    onChange={(e) => setPlayerForm(prev => ({ ...prev, jersey: e.target.value }))}
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
                    <TableCell>#{player.jersey}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{player.position}</Badge>
                    </TableCell>
                    <TableCell>${player.totalFines}</TableCell>
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
                                  <p className="text-sm text-muted-foreground">#{player.jersey}</p>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium">Position</Label>
                                  <p className="text-sm text-muted-foreground">{player.position}</p>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium">Total Fines</Label>
                                  <p className="text-sm font-medium text-destructive">${player.totalFines}</p>
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
                                    value={editingPlayer.jersey}
                                    onChange={(e) => setEditingPlayer(prev => 
                                      prev ? { ...prev, jersey: e.target.value } : null
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
                      <TableCell>#{player.jersey}</TableCell>
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
  systemConfig 
}: {
  fineReasons: FineReason[];
  setFineReasons: (reasons: FineReason[]) => void;
  activeReasons: FineReason[];
  systemConfig: SystemConfig;
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
      id: Date.now().toString(),
      name: reasonForm.name,
      defaultAmount: reasonForm.defaultAmount,
      description: reasonForm.description,
      isDeleted: false
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

  const handleDeleteReason = (reasonId: string) => {
    const updatedReasons = fineReasons.map(r => 
      r.id === reasonId ? { ...r, isDeleted: true } : r
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

function RolesTab({ 
  users, 
  setUsers, 
  currentUserRole 
}: {
  users: UserRole[];
  setUsers: (users: UserRole[]) => void;
  currentUserRole: 'admin' | 'super_admin';
}) {
  const [showPromoteConfirm, setShowPromoteConfirm] = useState<UserRole | null>(null);

  const handleRoleChange = (userId: string, newRole: 'viewer' | 'admin' | 'super_admin') => {
    if (newRole === 'super_admin') {
      const user = users.find(u => u.id === userId);
      if (user) {
        setShowPromoteConfirm(user);
      }
      return;
    }

    const updatedUsers = users.map(u => 
      u.id === userId ? { ...u, role: newRole } : u
    );
    setUsers(updatedUsers);
    toast.success(`User role updated to ${newRole}`);
  };

  const confirmSuperAdminPromotion = () => {
    if (!showPromoteConfirm) return;

    // Demote current super admin
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
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-display font-bold">Roles Management</h2>
        <p className="text-muted-foreground">Manage user roles and permissions (Super Admin only)</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCog className="h-5 w-5" />
            User Roles
          </CardTitle>
          <CardDescription>
            Control user access levels and permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Current Role</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
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
                    <div className="flex items-center gap-2">
                      {user.role !== 'admin' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRoleChange(user.id, 'admin')}
                        >
                          {user.role === 'viewer' ? 'Promote to Admin' : 'Demote to Admin'}
                        </Button>
                      )}
                      {user.role === 'admin' && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRoleChange(user.id, 'viewer')}
                          >
                            Demote to Viewer
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRoleChange(user.id, 'super_admin')}
                          >
                            Make Super Admin
                          </Button>
                        </>
                      )}
                      {user.role === 'viewer' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRoleChange(user.id, 'admin')}
                        >
                          Promote to Admin
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmSuperAdminPromotion}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Confirm Assignment
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