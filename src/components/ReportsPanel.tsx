"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format, subDays, startOf, endOf } from "date-fns";
import { 
  TrendingUp, 
  BarChart3, 
  PieChart, 
  Download, 
  Calendar as CalendarIcon,
  Filter,
  RefreshCw,
  Users,
  AlertTriangle,
  DollarSign,
  Target,
  FileBarChart
} from "lucide-react";
import { toast } from "sonner";

interface SummaryData {
  totalFines: number;
  totalAmount: number;
  averageFineAmount: number;
  mostCommonReason: string;
  topPlayer: string;
  thisWeekFines: number;
  thisMonthFines: number;
}

interface PlayerBreakdown {
  playerId: number;
  playerName: string;
  totalFines: number;
  totalAmount: number;
  averageAmount: number;
  lastFineDate: string;
}

interface ReasonBreakdown {
  reasonId: number;
  reasonName: string;
  count: number;
  totalAmount: number;
  averageAmount: number;
  lastUsed: string;
}

interface DateRange {
  from?: Date;
  to?: Date;
}

interface ReportsPanelProps {
  userRole?: "viewer" | "admin" | "superadmin";
}

export default function ReportsPanel({ userRole }: ReportsPanelProps) {
  const [activeTab, setActiveTab] = useState("summary");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Data states
  const [summaryData, setSummaryData] = useState<SummaryData>({
    totalFines: 0,
    totalAmount: 0,
    averageFineAmount: 0,
    mostCommonReason: "No data",
    topPlayer: "No data",
    thisWeekFines: 0,
    thisMonthFines: 0
  });
  const [playerBreakdown, setPlayerBreakdown] = useState<PlayerBreakdown[]>([]);
  const [reasonBreakdown, setReasonBreakdown] = useState<ReasonBreakdown[]>([]);

  // Filter states
  const [dateRange, setDateRange] = useState<DateRange>({
    from: subDays(new Date(), 30),
    to: new Date()
  });
  const [selectedPlayer, setSelectedPlayer] = useState<string>("all");
  const [selectedReason, setSelectedReason] = useState<string>("all");

  // Available players and reasons for filters
  const [players, setPlayers] = useState<any[]>([]);
  const [fineReasons, setFineReasons] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      fetchReports();
    }
  }, [dateRange, selectedPlayer, selectedReason]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('bearer_token');
      const headers = {
        'Authorization': `Bearer ${token}`,
      };

      // Fetch players and fine reasons for filters
      const [playersRes, reasonsRes] = await Promise.all([
        fetch('/api/players', { headers }),
        fetch('/api/fine-reasons', { headers })
      ]);

      if (playersRes.ok) {
        const playersData = await playersRes.json();
        setPlayers(Array.isArray(playersData) ? playersData.filter(p => !p.deletedAt) : []);
      }

      if (reasonsRes.ok) {
        const reasonsData = await reasonsRes.json();
        setFineReasons(Array.isArray(reasonsData) ? reasonsData.filter(r => !r.deletedAt) : []);
      }

      await fetchReports();
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load report data');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchReports = async () => {
    try {
      const token = localStorage.getItem('bearer_token');
      const headers = {
        'Authorization': `Bearer ${token}`,
      };

      // Build query params
      const params = new URLSearchParams();
      if (dateRange.from) params.append('start_date', format(dateRange.from, 'yyyy-MM-dd'));
      if (dateRange.to) params.append('end_date', format(dateRange.to, 'yyyy-MM-dd'));
      if (selectedPlayer !== 'all') params.append('player_id', selectedPlayer);
      if (selectedReason !== 'all') params.append('fine_reason_id', selectedReason);

      const queryString = params.toString();

      // Fetch all report data
      const [summaryRes, playerRes, reasonRes] = await Promise.all([
        fetch(`/api/reports/summary?${queryString}`, { headers }),
        fetch(`/api/reports/player-breakdown?${queryString}`, { headers }),
        fetch(`/api/reports/reason-breakdown?${queryString}`, { headers })
      ]);

      if (summaryRes.ok) {
        const data = await summaryRes.json();
        setSummaryData(data);
      }

      if (playerRes.ok) {
        const data = await playerRes.json();
        setPlayerBreakdown(Array.isArray(data) ? data : []);
      }

      if (reasonRes.ok) {
        const data = await reasonRes.json();
        setReasonBreakdown(Array.isArray(data) ? data : []);
      }

    } catch (error) {
      console.error('Error fetching reports:', error);
      toast.error('Failed to refresh report data');
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchReports();
    setIsRefreshing(false);
    toast.success("Reports refreshed successfully");
  };

  const handleExportReport = (reportType: string) => {
    // Mock export functionality
    toast.success(`${reportType} report exported successfully`);
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toFixed(2)}`;
  };

  // Quick date range presets
  const setQuickDateRange = (days: number) => {
    setDateRange({
      from: subDays(new Date(), days),
      to: new Date()
    });
  };

  if (isLoading) {
    return (
      <div className="w-full max-w-7xl mx-auto p-6 flex items-center justify-center min-h-96">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold">Reports & Analytics</h1>
          <p className="text-muted-foreground">
            Detailed insights into team fines and penalties
          </p>
        </div>
        <Button 
          onClick={handleRefresh} 
          disabled={isRefreshing}
          className="flex items-center gap-2"
        >
          <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
          Refresh Data
        </Button>
      </div>

      {/* Filter Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Report Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Date Range */}
            <div className="space-y-2">
              <Label>Date Range</Label>
              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn("justify-start text-left font-normal")}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange.from ? format(dateRange.from, 'MMM dd') : 'From'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={dateRange.from}
                      onSelect={(date) => setDateRange(prev => ({ ...prev, from: date }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn("justify-start text-left font-normal")}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange.to ? format(dateRange.to, 'MMM dd') : 'To'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={dateRange.to}
                      onSelect={(date) => setDateRange(prev => ({ ...prev, to: date }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Quick Date Presets */}
            <div className="space-y-2">
              <Label>Quick Ranges</Label>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" onClick={() => setQuickDateRange(7)}>
                  7d
                </Button>
                <Button variant="outline" size="sm" onClick={() => setQuickDateRange(30)}>
                  30d
                </Button>
                <Button variant="outline" size="sm" onClick={() => setQuickDateRange(90)}>
                  90d
                </Button>
              </div>
            </div>

            {/* Player Filter */}
            <div className="space-y-2">
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

            {/* Reason Filter */}
            <div className="space-y-2">
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

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="player-breakdown">Player Breakdown</TabsTrigger>
          <TabsTrigger value="reason-breakdown">Reason Breakdown</TabsTrigger>
        </TabsList>

        {/* Summary Tab */}
        <TabsContent value="summary" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Fines</p>
                    <p className="text-2xl font-bold">{summaryData.totalFines}</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Amount</p>
                    <p className="text-2xl font-bold">{formatCurrency(summaryData.totalAmount)}</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Average Fine</p>
                    <p className="text-2xl font-bold">{formatCurrency(summaryData.averageFineAmount)}</p>
                  </div>
                  <Target className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">This Week</p>
                    <p className="text-2xl font-bold">{summaryData.thisWeekFines}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Summary Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Key Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Most Common Reason:</span>
                  <Badge variant="outline">{summaryData.mostCommonReason}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Top Player (by fines):</span>
                  <Badge variant="outline">{summaryData.topPlayer}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">This Month:</span>
                  <Badge variant="secondary">{summaryData.thisMonthFines} fines</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Export Options</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  onClick={() => handleExportReport('Summary')} 
                  className="w-full flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Export Summary Report
                </Button>
                <Button 
                  onClick={() => handleExportReport('Detailed')} 
                  variant="outline"
                  className="w-full flex items-center gap-2"
                >
                  <FileBarChart className="h-4 w-4" />
                  Export Detailed Report
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Player Breakdown Tab */}
        <TabsContent value="player-breakdown" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Player Performance Breakdown</h3>
              <p className="text-muted-foreground">Fine statistics by individual player</p>
            </div>
            <Button 
              onClick={() => handleExportReport('Player Breakdown')} 
              variant="outline"
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Player</TableHead>
                    <TableHead className="text-right">Total Fines</TableHead>
                    <TableHead className="text-right">Total Amount</TableHead>
                    <TableHead className="text-right">Average Amount</TableHead>
                    <TableHead>Last Fine Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {playerBreakdown.map((player) => (
                    <TableRow key={player.playerId}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                            <span className="text-xs font-medium">
                              {player.playerName.charAt(0)}
                            </span>
                          </div>
                          <span className="font-medium">{player.playerName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline">{player.totalFines}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="destructive" className="font-mono">
                          {formatCurrency(player.totalAmount)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-mono">{formatCurrency(player.averageAmount)}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {player.lastFineDate ? format(new Date(player.lastFineDate), 'MMM dd, yyyy') : 'No fines'}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {playerBreakdown.length === 0 && (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No player data found for the selected criteria</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reason Breakdown Tab */}
        <TabsContent value="reason-breakdown" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Fine Reason Analysis</h3>
              <p className="text-muted-foreground">Statistics by fine reason type</p>
            </div>
            <Button 
              onClick={() => handleExportReport('Reason Breakdown')} 
              variant="outline"
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fine Reason</TableHead>
                    <TableHead className="text-right">Count</TableHead>
                    <TableHead className="text-right">Total Amount</TableHead>
                    <TableHead className="text-right">Average Amount</TableHead>
                    <TableHead>Last Used</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reasonBreakdown.map((reason) => (
                    <TableRow key={reason.reasonId}>
                      <TableCell>
                        <span className="font-medium">{reason.reasonName}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline">{reason.count} times</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="secondary" className="font-mono">
                          {formatCurrency(reason.totalAmount)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-mono">{formatCurrency(reason.averageAmount)}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {reason.lastUsed ? format(new Date(reason.lastUsed), 'MMM dd, yyyy') : 'Never used'}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {reasonBreakdown.length === 0 && (
                <div className="text-center py-8">
                  <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No reason data found for the selected criteria</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}