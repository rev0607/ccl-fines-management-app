"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  SearchX, 
  ListFilter, 
  TableOfContents, 
  LayoutPanelTop, 
  SlidersHorizontal, 
  Undo, 
  PanelTop,
  Fullscreen,
  TableRowsSplit
} from "lucide-react";
import { toast } from "sonner";

interface Fine {
  id: string;
  playerId: string;
  playerName: string;
  playerAvatar?: string;
  reason: string;
  amount: number;
  date: string;
  addedBy: string;
  addedByName: string;
  isDeleted?: boolean;
  deletedAt?: string;
}

interface Player {
  id: string;
  name: string;
  avatar?: string;
}

interface FineReason {
  id: string;
  name: string;
  defaultAmount: number;
}

interface QuickFine {
  reason: string;
  amount: number;
  label: string;
}

type UserRole = 'viewer' | 'admin' | 'superadmin';
type ViewMode = 'compact' | 'table';
type TimePeriod = 'weekly' | 'monthly' | 'quarterly' | 'half-yearly' | 'yearly' | 'custom';

const QUICK_FINES: QuickFine[] = [
  { reason: 'Late Arrival', amount: 50, label: 'Late Arrival ₹50' },
  { reason: 'Missed Practice', amount: 100, label: 'Missed Practice ₹100' },
  { reason: 'Equipment Missing', amount: 75, label: 'Equipment Missing ₹75' },
  { reason: 'Unsporting Behavior', amount: 200, label: 'Unsporting Behavior ₹200' },
];

const MOCK_PLAYERS: Player[] = [
  { id: '1', name: 'Rajesh Kumar', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face' },
  { id: '2', name: 'Priya Sharma', avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b1c5?w=100&h=100&fit=crop&crop=face' },
  { id: '3', name: 'Amit Patel', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face' },
  { id: '4', name: 'Neha Singh', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face' },
];

const MOCK_REASONS: FineReason[] = [
  { id: '1', name: 'Late Arrival', defaultAmount: 50 },
  { id: '2', name: 'Missed Practice', defaultAmount: 100 },
  { id: '3', name: 'Equipment Missing', defaultAmount: 75 },
  { id: '4', name: 'Unsporting Behavior', defaultAmount: 200 },
  { id: '5', name: 'Uniform Violation', defaultAmount: 30 },
];

export default function FinesPanel() {
  const [userRole] = useState<UserRole>('admin'); // Mock role
  const [isLoading, setIsLoading] = useState(true);
  const [fines, setFines] = useState<Fine[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('compact');
  const [showAddPanel, setShowAddPanel] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  
  // Filter states
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('monthly');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [customDateRange, setCustomDateRange] = useState({ start: '', end: '' });
  
  // Add fine form
  const [addFineForm, setAddFineForm] = useState({
    playerId: '',
    reason: '',
    amount: 0,
    date: new Date().toISOString().split('T')[0]
  });
  
  // Export options
  const [exportOptions, setExportOptions] = useState({
    format: 'excel' as 'excel' | 'pdf',
    type: 'full' as 'full' | 'summary',
    includeBranding: true
  });

  // Mock data loading
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockFines: Fine[] = [
        {
          id: '1',
          playerId: '1',
          playerName: 'Rajesh Kumar',
          playerAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
          reason: 'Late Arrival',
          amount: 50,
          date: '2024-01-15',
          addedBy: 'admin1',
          addedByName: 'Admin User'
        },
        {
          id: '2',
          playerId: '2',
          playerName: 'Priya Sharma',
          playerAvatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b1c5?w=100&h=100&fit=crop&crop=face',
          reason: 'Missed Practice',
          amount: 100,
          date: '2024-01-14',
          addedBy: 'admin1',
          addedByName: 'Admin User'
        },
        {
          id: '3',
          playerId: '3',
          playerName: 'Amit Patel',
          playerAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
          reason: 'Equipment Missing',
          amount: 75,
          date: '2024-01-13',
          addedBy: 'superadmin1',
          addedByName: 'Super Admin',
          isDeleted: true,
          deletedAt: '2024-01-16'
        },
      ];
      
      setFines(mockFines);
      setIsLoading(false);
    };

    loadData();
  }, []);

  // Debounced search
  const debouncedSearch = useCallback(
    useMemo(() => {
      const debounce = (func: Function, wait: number) => {
        let timeout: NodeJS.Timeout;
        return (...args: any[]) => {
          clearTimeout(timeout);
          timeout = setTimeout(() => func.apply(null, args), wait);
        };
      };
      return debounce((query: string) => {
        // In real app, this would trigger API search
        console.log('Searching:', query);
      }, 300);
    }, []),
    []
  );

  useEffect(() => {
    if (searchQuery) {
      debouncedSearch(searchQuery);
    }
  }, [searchQuery, debouncedSearch]);

  // Filtered fines
  const filteredFines = useMemo(() => {
    return fines.filter(fine => {
      const matchesSearch = !searchQuery || 
        fine.playerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        fine.reason.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesPlayer = selectedPlayers.length === 0 || selectedPlayers.includes(fine.playerId);
      const matchesReason = selectedReasons.length === 0 || selectedReasons.includes(fine.reason);
      
      return matchesSearch && matchesPlayer && matchesReason;
    });
  }, [fines, searchQuery, selectedPlayers, selectedReasons]);

  // Form handlers
  const handleAddFine = async () => {
    if (!addFineForm.playerId || !addFineForm.reason || addFineForm.amount <= 0) {
      toast.error('Please fill all required fields');
      return;
    }

    const player = MOCK_PLAYERS.find(p => p.id === addFineForm.playerId);
    const newFine: Fine = {
      id: Date.now().toString(),
      playerId: addFineForm.playerId,
      playerName: player?.name || '',
      playerAvatar: player?.avatar,
      reason: addFineForm.reason,
      amount: addFineForm.amount,
      date: addFineForm.date,
      addedBy: 'current-user',
      addedByName: 'Current User'
    };

    setFines(prev => [newFine, ...prev]);
    setAddFineForm({
      playerId: '',
      reason: '',
      amount: 0,
      date: new Date().toISOString().split('T')[0]
    });
    toast.success('Fine added successfully');
  };

  const handleQuickFine = async (quickFine: QuickFine) => {
    if (!addFineForm.playerId) {
      toast.error('Please select a player first');
      return;
    }

    const updatedForm = {
      ...addFineForm,
      reason: quickFine.reason,
      amount: quickFine.amount
    };
    
    setAddFineForm(updatedForm);
    
    // Auto-submit after a brief delay to show the form update
    setTimeout(() => {
      handleAddFine();
    }, 100);
  };

  const handleSoftDelete = async (fineId: string) => {
    setFines(prev => prev.map(fine => 
      fine.id === fineId 
        ? { ...fine, isDeleted: true, deletedAt: new Date().toISOString() }
        : fine
    ));
    toast.success('Fine deleted', {
      action: {
        label: 'Undo',
        onClick: () => handleRestoreFine(fineId)
      }
    });
  };

  const handleRestoreFine = async (fineId: string) => {
    setFines(prev => prev.map(fine => 
      fine.id === fineId 
        ? { ...fine, isDeleted: false, deletedAt: undefined }
        : fine
    ));
    toast.success('Fine restored');
  };

  const handleExport = async () => {
    // Mock export functionality
    toast.success(`Exporting ${exportOptions.format.toUpperCase()} file...`);
    setShowExportModal(false);
  };

  const handleShare = async () => {
    // Mock share functionality
    const message = `CCL Fines Report - ${filteredFines.length} fines found`;
    const url = `whatsapp://send?text=${encodeURIComponent(message)}`;
    
    if (typeof window !== 'undefined') {
      window.open(url, '_blank');
    }
    toast.success('Opening WhatsApp...');
  };

  // Update amount when reason changes
  useEffect(() => {
    if (addFineForm.reason) {
      const reason = MOCK_REASONS.find(r => r.name === addFineForm.reason);
      if (reason) {
        setAddFineForm(prev => ({ ...prev, amount: reason.defaultAmount }));
      }
    }
  }, [addFineForm.reason]);

  const canAddFine = userRole === 'admin' || userRole === 'superadmin';
  const canDelete = userRole === 'superadmin';

  return (
    <div className="space-y-6 p-6">
      {/* Top Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Fines</h1>
          <p className="text-sm text-muted-foreground">Manage team fines and penalties</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <Select value={timePeriod} onValueChange={(value) => setTimePeriod(value as TimePeriod)}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="quarterly">Quarterly</SelectItem>
              <SelectItem value="half-yearly">Half-yearly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>
          
          <div className="relative">
            <Input
              placeholder="Search by player or reason..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-64 pl-10"
            />
            <SearchX className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          </div>
          
          <Button onClick={() => setShowExportModal(true)} variant="outline">
            <TableOfContents className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Custom Date Range */}
      {timePeriod === 'custom' && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <div>
                <Label htmlFor="start-date">Start Date</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={customDateRange.start}
                  onChange={(e) => setCustomDateRange(prev => ({ ...prev, start: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="end-date">End Date</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={customDateRange.end}
                  onChange={(e) => setCustomDateRange(prev => ({ ...prev, end: e.target.value }))}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Fine Panel */}
      {canAddFine && (
        <Collapsible open={showAddPanel} onOpenChange={setShowAddPanel}>
          <Card>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                <CardTitle className="flex items-center justify-between">
                  Add Fine
                  <PanelTop className={`h-4 w-4 transition-transform ${showAddPanel ? 'rotate-180' : ''}`} />
                </CardTitle>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="player">Player</Label>
                    <Select value={addFineForm.playerId} onValueChange={(value) => setAddFineForm(prev => ({ ...prev, playerId: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select player" />
                      </SelectTrigger>
                      <SelectContent>
                        {MOCK_PLAYERS.map(player => (
                          <SelectItem key={player.id} value={player.id}>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={player.avatar} />
                                <AvatarFallback>{player.name[0]}</AvatarFallback>
                              </Avatar>
                              {player.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="reason">Reason</Label>
                    <Select value={addFineForm.reason} onValueChange={(value) => setAddFineForm(prev => ({ ...prev, reason: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select reason" />
                      </SelectTrigger>
                      <SelectContent>
                        {MOCK_REASONS.map(reason => (
                          <SelectItem key={reason.id} value={reason.name}>
                            {reason.name} (₹{reason.defaultAmount})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="amount">Amount (₹)</Label>
                    <Input
                      id="amount"
                      type="number"
                      value={addFineForm.amount || ''}
                      onChange={(e) => setAddFineForm(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={addFineForm.date}
                      onChange={(e) => setAddFineForm(prev => ({ ...prev, date: e.target.value }))}
                    />
                  </div>
                </div>
                
                <div>
                  <Label>Quick Fine Buttons</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                    {QUICK_FINES.map((quickFine, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuickFine(quickFine)}
                        disabled={!addFineForm.playerId}
                        className="text-xs"
                      >
                        {quickFine.label}
                      </Button>
                    ))}
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button onClick={handleAddFine} className="flex-1">
                    Add Fine
                  </Button>
                  <Button variant="outline" onClick={() => setShowAddPanel(false)}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}

      {/* View Controls */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'compact' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('compact')}
              >
                <LayoutPanelTop className="h-4 w-4 mr-2" />
                Compact
              </Button>
              <Button
                variant={viewMode === 'table' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('table')}
              >
                <TableRowsSplit className="h-4 w-4 mr-2" />
                Table
              </Button>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <ListFilter className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Filters Panel */}
      {showFilters && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Filters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Players</Label>
                <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
                  {MOCK_PLAYERS.map(player => (
                    <div key={player.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`player-${player.id}`}
                        checked={selectedPlayers.includes(player.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedPlayers(prev => [...prev, player.id]);
                          } else {
                            setSelectedPlayers(prev => prev.filter(id => id !== player.id));
                          }
                        }}
                      />
                      <label htmlFor={`player-${player.id}`} className="flex items-center gap-2 cursor-pointer">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={player.avatar} />
                          <AvatarFallback>{player.name[0]}</AvatarFallback>
                        </Avatar>
                        {player.name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <Label>Reasons</Label>
                <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
                  {MOCK_REASONS.map(reason => (
                    <div key={reason.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`reason-${reason.id}`}
                        checked={selectedReasons.includes(reason.name)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedReasons(prev => [...prev, reason.name]);
                          } else {
                            setSelectedReasons(prev => prev.filter(name => name !== reason.name));
                          }
                        }}
                      />
                      <label htmlFor={`reason-${reason.id}`} className="cursor-pointer">
                        {reason.name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedPlayers([]);
                  setSelectedReasons([]);
                }}
              >
                Clear All
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Fines List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Fines ({filteredFines.length})
            <Badge variant="secondary">
              Total: ₹{filteredFines.reduce((sum, fine) => sum + (fine.isDeleted ? 0 : fine.amount), 0)}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredFines.length === 0 ? (
            <div className="text-center py-12">
              <SearchX className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No fines found</h3>
              <p className="text-muted-foreground mb-4">
                {canAddFine ? "Add your first fine or adjust your filters" : "No fines match your current filters"}
              </p>
              {canAddFine && (
                <Button onClick={() => setShowAddPanel(true)}>
                  Add First Fine
                </Button>
              )}
            </div>
          ) : viewMode === 'compact' ? (
            <div className="space-y-3">
              {filteredFines.map(fine => (
                <div
                  key={fine.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border ${
                    fine.isDeleted ? 'opacity-50 bg-muted/20' : 'bg-card hover:bg-muted/50'
                  } transition-colors`}
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={fine.playerAvatar} />
                    <AvatarFallback>{fine.playerName[0]}</AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{fine.playerName}</span>
                      {fine.isDeleted && <Badge variant="destructive" className="text-xs">Deleted</Badge>}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{fine.reason}</span>
                      <span>•</span>
                      <span>{new Date(fine.date).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="font-semibold">₹{fine.amount}</div>
                    <div className="text-xs text-muted-foreground">by {fine.addedByName}</div>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <SlidersHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>View Details</DropdownMenuItem>
                      {userRole !== 'viewer' && !fine.isDeleted && (
                        <DropdownMenuItem>Edit Fine</DropdownMenuItem>
                      )}
                      {fine.isDeleted ? (
                        canDelete && (
                          <DropdownMenuItem onClick={() => handleRestoreFine(fine.id)}>
                            <Undo className="h-4 w-4 mr-2" />
                            Restore
                          </DropdownMenuItem>
                        )
                      ) : (
                        canDelete && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={() => handleSoftDelete(fine.id)}
                            >
                              Delete Fine
                            </DropdownMenuItem>
                          </>
                        )
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Player</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Added By</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFines.map(fine => (
                    <TableRow key={fine.id} className={fine.isDeleted ? 'opacity-50' : ''}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={fine.playerAvatar} />
                            <AvatarFallback>{fine.playerName[0]}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{fine.playerName}</div>
                            {fine.isDeleted && <Badge variant="destructive" className="text-xs">Deleted</Badge>}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{fine.reason}</TableCell>
                      <TableCell className="font-semibold">₹{fine.amount}</TableCell>
                      <TableCell>{new Date(fine.date).toLocaleDateString()}</TableCell>
                      <TableCell>{fine.addedByName}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <SlidersHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>View Details</DropdownMenuItem>
                            {userRole !== 'viewer' && !fine.isDeleted && (
                              <DropdownMenuItem>Edit Fine</DropdownMenuItem>
                            )}
                            {fine.isDeleted ? (
                              canDelete && (
                                <DropdownMenuItem onClick={() => handleRestoreFine(fine.id)}>
                                  <Undo className="h-4 w-4 mr-2" />
                                  Restore
                                </DropdownMenuItem>
                              )
                            ) : (
                              canDelete && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    className="text-destructive"
                                    onClick={() => handleSoftDelete(fine.id)}
                                  >
                                    Delete Fine
                                  </DropdownMenuItem>
                                </>
                              )
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Export Modal */}
      <Dialog open={showExportModal} onOpenChange={setShowExportModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Export Fines</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Export Format</Label>
              <Select 
                value={exportOptions.format} 
                onValueChange={(value) => setExportOptions(prev => ({ ...prev, format: value as 'excel' | 'pdf' }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="excel">Excel (.xlsx)</SelectItem>
                  <SelectItem value="pdf">PDF Document</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Export Type</Label>
              <Select 
                value={exportOptions.type} 
                onValueChange={(value) => setExportOptions(prev => ({ ...prev, type: value as 'full' | 'summary' }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full">Full Breakdown</SelectItem>
                  <SelectItem value="summary">Summary Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="branding"
                checked={exportOptions.includeBranding}
                onCheckedChange={(checked) => setExportOptions(prev => ({ ...prev, includeBranding: !!checked }))}
              />
              <label htmlFor="branding">Include app branding</label>
            </div>
            
            <div className="flex gap-2">
              <Button onClick={handleExport} className="flex-1">
                Export
              </Button>
              <Button onClick={handleShare} variant="outline">
                Share via WhatsApp
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}