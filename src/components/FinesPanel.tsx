"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Trash2, 
  Eye, 
  EyeOff, 
  Calendar as CalendarIcon,
  Coins,
  TrendingUp,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  RotateCcw,
  FileDown,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { toast } from "sonner";

interface Fine {
  id: number;
  playerId: number;
  playerName: string;
  playerAvatar?: string;
  fineReasonId: number;
  fineReasonName: string;
  amount: number;
  fineDate: string;
  addedById: number;
  addedByName: string;
  createdAt: string;
  deletedAt?: string;
}

interface Player {
  id: number;
  name: string;
  email: string;
  jerseyNumber: string;
  position: string;
  avatarUrl?: string;
}

interface FineReason {
  id: number;
  name: string;
  defaultAmount: number;
  description?: string;
}

interface FinesPanelProps {
  userRole?: "viewer" | "admin" | "superadmin";
}

export default function FinesPanel({ userRole }: FinesPanelProps) {
  const [activeSubTab, setActiveSubTab] = useState("fines");
  const [fines, setFines] = useState<Fine[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [fineReasons, setFineReasons] = useState<FineReason[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAddFineModal, setShowAddFineModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPlayer, setSelectedPlayer] = useState<string>("all");
  const [selectedReason, setSelectedReason] = useState<string>("all");
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [showDeleted, setShowDeleted] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const [formData, setFormData] = useState({
    playerId: "",
    fineReasonId: "",
    amount: "",
    fineDate: format(new Date(), "yyyy-MM-dd"),
    customReason: ""
  });

  const canAddFines = userRole === "admin" || userRole === "superadmin";
  const canDeleteFines = userRole === "superadmin";
  const canViewDeleted = userRole === "superadmin";

  useEffect(() => {
    fetchData();
  }, []);

  // Refresh data function
  const refreshData = async () => {
    await Promise.all([
      fetchPlayers(),
      fetchFineReasons(),
      fetchFines()
    ]);
  };

  // Listen for storage events to refresh data when other tabs make changes
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'fines_data_updated' || e.key === 'players_data_updated' || e.key === 'fine_reasons_data_updated') {
        refreshData();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        fetchFines(),
        fetchPlayers(),
        fetchFineReasons()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFines = async () => {
    try {
      const token = localStorage.getItem('bearer_token');
      const params = new URLSearchParams();
      
      if (searchTerm) params.append('search', searchTerm);
      if (selectedPlayer !== 'all') params.append('player_id', selectedPlayer);
      if (selectedReason !== 'all') params.append('fine_reason_id', selectedReason);
      if (dateRange.from) params.append('start_date', format(dateRange.from, 'yyyy-MM-dd'));
      if (dateRange.to) params.append('end_date', format(dateRange.to, 'yyyy-MM-dd'));
      if (showDeleted) params.append('include_deleted', 'true');
      
      const response = await fetch(`/api/fines?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setFines(Array.isArray(data) ? data : []);
      } else {
        console.error('Failed to fetch fines');
        setFines([]);
      }
    } catch (error) {
      console.error('Fetch fines error:', error);
      setFines([]);
    }
  };

  const fetchPlayers = async () => {
    try {
      const token = localStorage.getItem('bearer_token');
      const response = await fetch('/api/players', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPlayers(Array.isArray(data) ? data.filter((player: Player) => !player.deletedAt) : []);
      }
    } catch (error) {
      console.error('Fetch players error:', error);
      setPlayers([]);
    }
  };

  const fetchFineReasons = async () => {
    try {
      const token = localStorage.getItem('bearer_token');
      const response = await fetch('/api/fine-reasons', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setFineReasons(Array.isArray(data) ? data.filter((reason: FineReason) => !reason.deletedAt) : []);
      }
    } catch (error) {
      console.error('Fetch fine reasons error:', error);
      setFineReasons([]);
    }
  };

  useEffect(() => {
    const debounce = setTimeout(() => {
      fetchFines();
    }, 300);

    return () => clearTimeout(debounce);
  }, [searchTerm, selectedPlayer, selectedReason, dateRange, showDeleted]);

  const formatCurrency = (amount: number) => {
    return `₹${amount.toFixed(2)}`;
  };

  const handleAddFine = async () => {
    if (!formData.playerId || !formData.fineReasonId || !formData.amount) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('bearer_token');
      const response = await fetch('/api/fines', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          playerId: parseInt(formData.playerId),
          fineReasonId: parseInt(formData.fineReasonId),
          amount: parseFloat(formData.amount),
          fineDate: formData.fineDate,
        }),
      });

      if (response.ok) {
        toast.success("Fine added successfully!");
        setShowAddFineModal(false);
        setFormData({
          playerId: "",
          fineReasonId: "",
          amount: "",
          fineDate: format(new Date(), "yyyy-MM-dd"),
          customReason: ""
        });
        fetchFines();
        // Notify other tabs that data has changed
        localStorage.setItem('fines_data_updated', Date.now().toString());
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to add fine");
      }
    } catch (error) {
      console.error('Add fine error:', error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteFine = async (fineId: number) => {
    try {
      const token = localStorage.getItem('bearer_token');
      const response = await fetch(`/api/fines/${fineId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        toast.success("Fine deleted successfully!");
        fetchFines();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to delete fine");
      }
    } catch (error) {
      console.error('Delete fine error:', error);
      toast.error("Something went wrong. Please try again.");
    }
  };

  const handleExport = async () => {
    try {
      const token = localStorage.getItem('bearer_token');
      const params = new URLSearchParams();
      
      if (searchTerm) params.append('search', searchTerm);
      if (selectedPlayer !== 'all') params.append('player_id', selectedPlayer);
      if (selectedReason !== 'all') params.append('fine_reason_id', selectedReason);
      if (dateRange.from) params.append('start_date', format(dateRange.from, 'yyyy-MM-dd'));
      if (dateRange.to) params.append('end_date', format(dateRange.to, 'yyyy-MM-dd'));
      
      const response = await fetch(`/api/fines/export?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `fines-export-${format(new Date(), 'yyyy-MM-dd')}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        toast.success("Export completed successfully!");
      } else {
        toast.error("Failed to export data");
      }
    } catch (error) {
      console.error('Export error:', error);
      toast.error("Export failed. Please try again.");
    }
  };

  const handleQuickFine = (reasonId: number, amount: number) => {
    setFormData(prev => ({
      ...prev,
      fineReasonId: reasonId.toString(),
      amount: amount.toString()
    }));
    setShowAddFineModal(true);
  };

  // Pagination logic
  const paginatedFines = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return fines.slice(startIndex, endIndex);
  }, [fines, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(fines.length / itemsPerPage);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  if (isLoading) {
    return (
      <div className="w-full max-w-7xl mx-auto p-6 flex items-center justify-center min-h-96">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading fines...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold">Fines Management</h1>
          <p className="text-muted-foreground">
            {userRole === "viewer" 
              ? "View and export team fines" 
              : "Manage team fines and penalties"
            }
          </p>
        </div>
      </div>

      <Tabs value={activeSubTab} onValueChange={setActiveSubTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          {canAddFines && (
            <TabsTrigger value="add-fine">Add Fine</TabsTrigger>
          )}
          <TabsTrigger value="fines">Fines</TabsTrigger>
          <TabsTrigger value="export">Export</TabsTrigger>
        </TabsList>

        {/* Add Fine Tab */}
        {canAddFines && (
          <TabsContent value="add-fine" className="space-y-6">
            <div className="flex items-center gap-4">
              <Dialog open={showAddFineModal} onOpenChange={setShowAddFineModal}>
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Add Fine
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Add New Fine</DialogTitle>
                    <DialogDescription>
                      Record a new fine for a team member
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="player">Player *</Label>
                        <Select 
                          value={formData.playerId} 
                          onValueChange={(value) => setFormData(prev => ({ ...prev, playerId: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select player" />
                          </SelectTrigger>
                          <SelectContent>
                            {players.map((player) => (
                              <SelectItem key={player.id} value={player.id.toString()}>
                                {player.name} (#{player.jerseyNumber})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="reason">Fine Reason *</Label>
                        <Select 
                          value={formData.fineReasonId}
                          onValueChange={(value) => {
                            const reason = fineReasons.find(r => r.id.toString() === value);
                            setFormData(prev => ({ 
                              ...prev, 
                              fineReasonId: value,
                              amount: reason ? reason.defaultAmount.toString() : prev.amount
                            }));
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select reason" />
                          </SelectTrigger>
                          <SelectContent>
                            {fineReasons.map((reason) => (
                              <SelectItem key={reason.id} value={reason.id.toString()}>
                                {reason.name} (₹{reason.defaultAmount})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="amount">Amount (₹) *</Label>
                        <Input
                          id="amount"
                          type="number"
                          min="0"
                          step="0.01"
                          value={formData.amount}
                          onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <Label htmlFor="date">Fine Date *</Label>
                        <Input
                          id="date"
                          type="date"
                          value={formData.fineDate}
                          onChange={(e) => setFormData(prev => ({ ...prev, fineDate: e.target.value }))}
                        />
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowAddFineModal(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddFine} disabled={isSubmitting}>
                      {isSubmitting ? "Adding..." : "Add Fine"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Fine Actions</CardTitle>
                <CardDescription>Common fines for quick entry</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {fineReasons.slice(0, 8).map((reason) => (
                    <Button
                      key={reason.id}
                      variant="outline"
                      className="h-auto p-4 flex flex-col items-center gap-2"
                      onClick={() => handleQuickFine(reason.id, reason.defaultAmount)}
                    >
                      <span className="font-medium">{reason.name}</span>
                      <Badge variant="secondary">₹{reason.defaultAmount}</Badge>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Fines Tab */}
        <TabsContent value="fines" className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">All Fines</h2>
              <p className="text-muted-foreground">
                {fines.length} total fines • Page {currentPage} of {totalPages}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                Filters
              </Button>
              {canViewDeleted && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDeleted(!showDeleted)}
                  className="flex items-center gap-2"
                >
                  {showDeleted ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  {showDeleted ? 'Hide Deleted' : 'Show Deleted'}
                </Button>
              )}
            </div>
          </div>

          {showFilters && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Filters
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <Label>Search</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search fines..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Player</Label>
                    <Select value={selectedPlayer} onValueChange={setSelectedPlayer}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Players</SelectItem>
                        {players.map((player) => (
                          <SelectItem key={player.id} value={player.id.toString()}>
                            {player.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Fine Reason</Label>
                    <Select value={selectedReason} onValueChange={setSelectedReason}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Reasons</SelectItem>
                        {fineReasons.map((reason) => (
                          <SelectItem key={reason.id} value={reason.id.toString()}>
                            {reason.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Player</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Added By</TableHead>
                    {canDeleteFines && <TableHead>Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedFines.map((fine) => (
                    <TableRow 
                      key={fine.id} 
                      className={fine.deletedAt ? "opacity-50" : ""}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                            <span className="text-xs font-medium">
                              {fine.playerName.charAt(0)}
                            </span>
                          </div>
                          <span className="font-medium">{fine.playerName}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <span className="font-medium">{fine.fineReasonName}</span>
                          {fine.deletedAt && (
                            <Badge variant="outline" className="ml-2 text-xs">
                              Deleted
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="destructive" className="font-mono">
                          ₹{fine.amount.toFixed(2)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(fine.fineDate), 'MMM dd, yyyy')}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {fine.addedByName}
                        </span>
                      </TableCell>
                      {canDeleteFines && (
                        <TableCell>
                          {!fine.deletedAt && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Fine</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete this fine? This action can be undone later.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => handleDeleteFine(fine.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {fines.length === 0 && (
                <div className="text-center py-8">
                  <Coins className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No fines found matching your criteria</p>
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Showing {Math.min((currentPage - 1) * itemsPerPage + 1, fines.length)} to{' '}
                    {Math.min(currentPage * itemsPerPage, fines.length)} of {fines.length} entries
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Export Tab */}
        <TabsContent value="export" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileDown className="h-5 w-5" />
                Export Fines Data
              </CardTitle>
              <CardDescription>
                Download fines data in CSV format with optional filters
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Player Filter</Label>
                  <Select value={selectedPlayer} onValueChange={setSelectedPlayer}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Players</SelectItem>
                      {players.map((player) => (
                        <SelectItem key={player.id} value={player.id.toString()}>
                          {player.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Fine Reason Filter</Label>
                  <Select value={selectedReason} onValueChange={setSelectedReason}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Reasons</SelectItem>
                      {fineReasons.map((reason) => (
                        <SelectItem key={reason.id} value={reason.id.toString()}>
                          {reason.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Search Filter</Label>
                  <Input
                    placeholder="Search term..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <div>
                  <Label>Date Range (Optional)</Label>
                  <div className="flex gap-2">
                    <Input
                      type="date"
                      value={dateRange.from ? format(dateRange.from, 'yyyy-MM-dd') : ''}
                      onChange={(e) => setDateRange(prev => ({ 
                        ...prev, 
                        from: e.target.value ? new Date(e.target.value) : undefined 
                      }))}
                      placeholder="From date"
                    />
                    <Input
                      type="date"
                      value={dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : ''}
                      onChange={(e) => setDateRange(prev => ({ 
                        ...prev, 
                        to: e.target.value ? new Date(e.target.value) : undefined 
                      }))}
                      placeholder="To date"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Export will include {fines.length} fines based on current filters
                    </p>
                  </div>
                  <Button onClick={handleExport} className="flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    Download CSV
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}