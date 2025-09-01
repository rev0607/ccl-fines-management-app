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
  TableRowsSplit,
  Loader2
} from "lucide-react";
import { toast } from "sonner";

// API Types based on database schema
interface Fine {
  id: number;
  playerId: number;
  playerName: string;
  fineReasonId: number;
  fineReason: string;
  amount: number;
  fineDate: string;
  addedByUserId: number;
  addedByUserName: string;
  createdAt: string;
  updatedAt: string;
}

interface Player {
  id: number;
  name: string;
  createdAt: string;
  updatedAt: string;
}

interface FineReason {
  id: number;
  reason: string;
  defaultAmount: number;
  createdAt: string;
  updatedAt: string;
}

interface QuickFine {
  reason: string;
  amount: number;
  label: string;
}

type UserRole = 'viewer' | 'admin' | 'superadmin';
type ViewMode = 'compact' | 'table';
type TimePeriod = 'weekly' | 'monthly' | 'quarterly' | 'half-yearly' | 'yearly' | 'custom';

export default function FinesPanel() {
  const [userRole] = useState<UserRole>('admin'); // Mock role - will be replaced with auth
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fines, setFines] = useState<Fine[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [fineReasons, setFineReasons] = useState<FineReason[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('compact');
  const [showAddPanel, setShowAddPanel] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  
  // Filter states
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('monthly');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlayers, setSelectedPlayers] = useState<number[]>([]);
  const [selectedReasons, setSelectedReasons] = useState<number[]>([]);
  const [customDateRange, setCustomDateRange] = useState({ start: '', end: '' });
  
  // Add fine form
  const [addFineForm, setAddFineForm] = useState({
    playerId: '',
    fineReasonId: '',
    amount: 0,
    fineDate: new Date().toISOString().split('T')[0]
  });
  
  // Export options
  const [exportOptions, setExportOptions] = useState({
    format: 'excel' as 'excel' | 'pdf',
    type: 'full' as 'full' | 'summary',
    includeBranding: true
  });

  // API Functions
  const fetchFines = async (filters?: {
    search?: string;
    playerId?: number;
    fineReasonId?: number;
    startDate?: string;
    endDate?: string;
  }) => {
    try {
      const params = new URLSearchParams();
      if (filters?.search) params.append('search', filters.search);
      if (filters?.playerId) params.append('player_id', filters.playerId.toString());
      if (filters?.fineReasonId) params.append('fine_reason_id', filters.fineReasonId.toString());
      if (filters?.startDate) params.append('start_date', filters.startDate);
      if (filters?.endDate) params.append('end_date', filters.endDate);
      
      const response = await fetch(`/api/fines?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch fines');
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching fines:', error);
      toast.error('Failed to load fines');
      return [];
    }
  };

  const fetchPlayers = async () => {
    try {
      const response = await fetch('/api/players');
      if (!response.ok) throw new Error('Failed to fetch players');
      return await response.json();
    } catch (error) {
      console.error('Error fetching players:', error);
      toast.error('Failed to load players');
      return [];
    }
  };

  const fetchFineReasons = async () => {
    try {
      const response = await fetch('/api/fine-reasons');
      if (!response.ok) throw new Error('Failed to fetch fine reasons');
      return await response.json();
    } catch (error) {
      console.error('Error fetching fine reasons:', error);
      toast.error('Failed to load fine reasons');
      return [];
    }
  };

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [finesData, playersData, reasonsData] = await Promise.all([
          fetchFines(),
          fetchPlayers(),
          fetchFineReasons()
        ]);
        
        setFines(finesData);
        setPlayers(playersData);
        setFineReasons(reasonsData);
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Generate date range based on time period
  const getDateRange = useCallback((period: TimePeriod) => {
    const now = new Date();
    const start = new Date();
    
    switch (period) {
      case 'weekly':
        start.setDate(now.getDate() - 7);
        break;
      case 'monthly':
        start.setMonth(now.getMonth() - 1);
        break;
      case 'quarterly':
        start.setMonth(now.getMonth() - 3);
        break;
      case 'half-yearly':
        start.setMonth(now.getMonth() - 6);
        break;
      case 'yearly':
        start.setFullYear(now.getFullYear() - 1);
        break;
      case 'custom':
        return {
          start: customDateRange.start,
          end: customDateRange.end
        };
      default:
        return { start: '', end: '' };
    }
    
    return {
      start: start.toISOString().split('T')[0],
      end: now.toISOString().split('T')[0]
    };
  }, [customDateRange]);

  // Debounced search with API calls
  const debouncedSearch = useCallback(
    useMemo(() => {
      const debounce = (func: Function, wait: number) => {
        let timeout: NodeJS.Timeout;
        return (...args: any[]) => {
          clearTimeout(timeout);
          timeout = setTimeout(() => func.apply(null, args), wait);
        };
      };
      return debounce(async (query: string) => {
        const dateRange = getDateRange(timePeriod);
        const filters = {
          search: query,
          playerId: selectedPlayers.length === 1 ? selectedPlayers[0] : undefined,
          fineReasonId: selectedReasons.length === 1 ? selectedReasons[0] : undefined,
          startDate: dateRange.start,
          endDate: dateRange.end
        };
        
        const newFines = await fetchFines(filters);
        setFines(newFines);
      }, 300);
    }, [timePeriod, selectedPlayers, selectedReasons, getDateRange]),
    [timePeriod, selectedPlayers, selectedReasons, getDateRange]
  );

  // Trigger search when filters change
  useEffect(() => {
    const searchFines = async () => {
      const dateRange = getDateRange(timePeriod);
      const filters = {
        search: searchQuery,
        playerId: selectedPlayers.length === 1 ? selectedPlayers[0] : undefined,
        fineReasonId: selectedReasons.length === 1 ? selectedReasons[0] : undefined,
        startDate: dateRange.start,
        endDate: dateRange.end
      };
      
      const newFines = await fetchFines(filters);
      setFines(newFines);
    };

    if (!isLoading) {
      if (searchQuery) {
        debouncedSearch(searchQuery);
      } else {
        searchFines();
      }
    }
  }, [searchQuery, timePeriod, selectedPlayers, selectedReasons, customDateRange, isLoading, debouncedSearch, getDateRange]);

  // Generate quick fines based on available reasons
  const quickFines = useMemo<QuickFine[]>(() => {
    return fineReasons.slice(0, 4).map(reason => ({
      reason: reason.reason,
      amount: reason.defaultAmount,
      label: `${reason.reason} ₹${reason.defaultAmount}`
    }));
  }, [fineReasons]);

  // Form handlers
  const handleAddFine = async () => {
    if (!addFineForm.playerId || !addFineForm.fineReasonId || addFineForm.amount <= 0) {
      toast.error('Please fill all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/fines', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          playerId: parseInt(addFineForm.playerId),
          fineReasonId: parseInt(addFineForm.fineReasonId),
          amount: addFineForm.amount,
          fineDate: addFineForm.fineDate
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add fine');
      }

      const newFine = await response.json();
      setFines(prev => [newFine, ...prev]);
      
      // Reset form
      setAddFineForm({
        playerId: '',
        fineReasonId: '',
        amount: 0,
        fineDate: new Date().toISOString().split('T')[0]
      });
      
      toast.success('Fine added successfully');
    } catch (error) {
      console.error('Error adding fine:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to add fine');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickFine = async (quickFine: QuickFine) => {
    if (!addFineForm.playerId) {
      toast.error('Please select a player first');
      return;
    }

    const reasonId = fineReasons.find(r => r.reason === quickFine.reason)?.id;
    if (!reasonId) {
      toast.error('Fine reason not found');
      return;
    }

    const updatedForm = {
      ...addFineForm,
      fineReasonId: reasonId.toString(),
      amount: quickFine.amount
    };
    
    setAddFineForm(updatedForm);
    
    // Auto-submit after form update
    setTimeout(async () => {
      setIsSubmitting(true);
      try {
        const response = await fetch('/api/fines', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            playerId: parseInt(updatedForm.playerId),
            fineReasonId: parseInt(updatedForm.fineReasonId),
            amount: updatedForm.amount,
            fineDate: updatedForm.fineDate
          })
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to add fine');
        }

        const newFine = await response.json();
        setFines(prev => [newFine, ...prev]);
        
        // Reset form
        setAddFineForm({
          playerId: '',
          fineReasonId: '',
          amount: 0,
          fineDate: new Date().toISOString().split('T')[0]
        });
        
        toast.success('Fine added successfully');
      } catch (error) {
        console.error('Error adding fine:', error);
        toast.error(error instanceof Error ? error.message : 'Failed to add fine');
      } finally {
        setIsSubmitting(false);
      }
    }, 100);
  };

  const handleSoftDelete = async (fineId: number) => {
    try {
      const response = await fetch(`/api/fines/${fineId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete fine');
      }

      // Remove from local state
      setFines(prev => prev.filter(fine => fine.id !== fineId));
      
      toast.success('Fine deleted successfully');
    } catch (error) {
      console.error('Error deleting fine:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete fine');
    }
  };

  const handleExport = async () => {
    try {
      const dateRange = getDateRange(timePeriod);
      const params = new URLSearchParams();
      
      if (searchQuery) params.append('search', searchQuery);
      if (selectedPlayers.length === 1) params.append('player_id', selectedPlayers[0].toString());
      if (selectedReasons.length === 1) params.append('fine_reason_id', selectedReasons[0].toString());
      if (dateRange.start) params.append('start_date', dateRange.start);
      if (dateRange.end) params.append('end_date', dateRange.end);

      const response = await fetch(`/api/fines/export?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to export fines');
      }

      // Create download link
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `ccl_fines_export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('Export completed successfully');
      setShowExportModal(false);
    } catch (error) {
      console.error('Error exporting fines:', error);
      toast.error('Failed to export fines');
    }
  };

  const handleShare = async () => {
    const message = `CCL Fines Report - ${fines.length} fines found. Total amount: ₹${fines.reduce((sum, fine) => sum + fine.amount, 0)}`;
    const url = `whatsapp://send?text=${encodeURIComponent(message)}`;
    
    if (typeof window !== 'undefined') {
      window.open(url, '_blank');
    }
    toast.success('Opening WhatsApp...');
  };

  // Update amount when reason changes
  useEffect(() => {
    if (addFineForm.fineReasonId) {
      const reason = fineReasons.find(r => r.id.toString() === addFineForm.fineReasonId);
      if (reason) {
        setAddFineForm(prev => ({ ...prev, amount: reason.defaultAmount }));
      }
    }
  }, [addFineForm.fineReasonId, fineReasons]);

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
                        {players.map(player => (
                          <SelectItem key={player.id} value={player.id.toString()}>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
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
                    <Select value={addFineForm.fineReasonId} onValueChange={(value) => setAddFineForm(prev => ({ ...prev, fineReasonId: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select reason" />
                      </SelectTrigger>
                      <SelectContent>
                        {fineReasons.map(reason => (
                          <SelectItem key={reason.id} value={reason.id.toString()}>
                            {reason.reason} (₹{reason.defaultAmount})
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
                      value={addFineForm.fineDate}
                      onChange={(e) => setAddFineForm(prev => ({ ...prev, fineDate: e.target.value }))}
                    />
                  </div>
                </div>
                
                <div>
                  <Label>Quick Fine Buttons</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                    {quickFines.map((quickFine, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuickFine(quickFine)}
                        disabled={!addFineForm.playerId || isSubmitting}
                        className="text-xs"
                      >
                        {isSubmitting ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          quickFine.label
                        )}
                      </Button>
                    ))}
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button onClick={handleAddFine} className="flex-1" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Adding Fine...
                      </>
                    ) : (
                      'Add Fine'
                    )}
                  </Button>
                  <Button variant="outline" onClick={() => setShowAddPanel(false)} disabled={isSubmitting}>
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
                  {players.map(player => (
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
                  {fineReasons.map(reason => (
                    <div key={reason.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`reason-${reason.id}`}
                        checked={selectedReasons.includes(reason.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedReasons(prev => [...prev, reason.id]);
                          } else {
                            setSelectedReasons(prev => prev.filter(id => id !== reason.id));
                          }
                        }}
                      />
                      <label htmlFor={`reason-${reason.id}`} className="cursor-pointer">
                        {reason.reason}
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
            Fines ({fines.length})
            <Badge variant="secondary">
              Total: ₹{fines.reduce((sum, fine) => sum + fine.amount, 0)}
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
          ) : fines.length === 0 ? (
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
              {fines.map(fine => (
                <div
                  key={fine.id}
                  className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>{fine.playerName[0]}</AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{fine.playerName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{fine.fineReason}</span>
                      <span>•</span>
                      <span>{new Date(fine.fineDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="font-semibold">₹{fine.amount}</div>
                    <div className="text-xs text-muted-foreground">by {fine.addedByUserName}</div>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <SlidersHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>View Details</DropdownMenuItem>
                      {userRole !== 'viewer' && (
                        <DropdownMenuItem>Edit Fine</DropdownMenuItem>
                      )}
                      {canDelete && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={() => handleSoftDelete(fine.id)}
                          >
                            Delete Fine
                          </DropdownMenuItem>
                        </>
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
                  {fines.map(fine => (
                    <TableRow key={fine.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>{fine.playerName[0]}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{fine.playerName}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{fine.fineReason}</TableCell>
                      <TableCell className="font-semibold">₹{fine.amount}</TableCell>
                      <TableCell>{new Date(fine.fineDate).toLocaleDateString()}</TableCell>
                      <TableCell>{fine.addedByUserName}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <SlidersHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>View Details</DropdownMenuItem>
                            {userRole !== 'viewer' && (
                              <DropdownMenuItem>Edit Fine</DropdownMenuItem>
                            )}
                            {canDelete && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  className="text-destructive"
                                  onClick={() => handleSoftDelete(fine.id)}
                                >
                                  Delete Fine
                                </DropdownMenuItem>
                              </>
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
                  <SelectItem value="pdf">CSV File (.csv)</SelectItem>
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