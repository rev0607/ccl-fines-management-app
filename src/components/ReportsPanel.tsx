"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart
} from "recharts";
import { 
  TrendingUp, 
  DollarSign, 
  Users, 
  AlertCircle, 
  Download,
  Calendar as CalendarIcon,
  BarChart3,
  PieChart as PieChartIcon,
  Activity
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ReportsPanelProps {
  userRole?: "viewer" | "admin" | "superadmin";
}

interface SummaryData {
  totalFines: number;
  totalAmount: number;
  uniquePlayers: number;
  averageFineAmount: number;
  mostCommonReason: string;
  highestFinedPlayer: string;
}

interface PlayerBreakdown {
  playerName: string;
  totalFines: number;
  totalAmount: number;
  averageAmount: number;
  jerseyNumber: string;
}

interface ReasonBreakdown {
  reasonName: string;
  count: number;
  totalAmount: number;
  averageAmount: number;
  percentage: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function ReportsPanel({ userRole = "viewer" }: ReportsPanelProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [selectedTimeframe, setSelectedTimeframe] = useState("all");
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
  const [playerBreakdown, setPlayerBreakdown] = useState<PlayerBreakdown[]>([]);
  const [reasonBreakdown, setReasonBreakdown] = useState<ReasonBreakdown[]>([]);

  useEffect(() => {
    fetchReportData();
  }, [selectedTimeframe, dateRange]);

  const fetchReportData = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('bearer_token');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      };

      // Build query parameters
      const params = new URLSearchParams();
      if (dateRange.from) params.append('start_date', format(dateRange.from, 'yyyy-MM-dd'));
      if (dateRange.to) params.append('end_date', format(dateRange.to, 'yyyy-MM-dd'));
      if (selectedTimeframe !== 'all') params.append('timeframe', selectedTimeframe);

      // Fetch summary data
      const summaryResponse = await fetch(`/api/reports/summary?${params.toString()}`, { headers });
      if (summaryResponse.ok) {
        const summary = await summaryResponse.json();
        setSummaryData({
          totalFines: summary.totalFines || 0,
          totalAmount: summary.totalAmount || 0,
          uniquePlayers: summary.uniquePlayers || 0,
          averageFineAmount: summary.averageFineAmount || 0,
          mostCommonReason: summary.mostCommonReason || 'N/A',
          highestFinedPlayer: summary.highestFinedPlayer || 'N/A'
        });
      }

      // Fetch player breakdown
      const playerResponse = await fetch(`/api/reports/player-breakdown?${params.toString()}`, { headers });
      if (playerResponse.ok) {
        const players = await playerResponse.json();
        setPlayerBreakdown(players);
      }

      // Fetch reason breakdown
      const reasonResponse = await fetch(`/api/reports/reason-breakdown?${params.toString()}`, { headers });
      if (reasonResponse.ok) {
        const reasons = await reasonResponse.json();
        setReasonBreakdown(reasons);
      }

    } catch (error) {
      console.error('Error fetching report data:', error);
      toast.error('Failed to load report data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportReport = async (type: 'summary' | 'detailed') => {
    try {
      const token = localStorage.getItem('bearer_token');
      const params = new URLSearchParams();
      
      if (dateRange.from) params.append('start_date', format(dateRange.from, 'yyyy-MM-dd'));
      if (dateRange.to) params.append('end_date', format(dateRange.to, 'yyyy-MM-dd'));
      if (selectedTimeframe !== 'all') params.append('timeframe', selectedTimeframe);
      params.append('report_type', type);

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
        a.download = `${type}-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        toast.success(`${type} report exported successfully!`);
      } else {
        toast.error("Failed to export report");
      }
    } catch (error) {
      console.error('Export error:', error);
      toast.error("Export failed. Please try again.");
    }
  };

  const chartData = useMemo(() => {
    return playerBreakdown.map(player => ({
      name: player.playerName,
      amount: player.totalAmount,
      fines: player.totalFines
    }));
  }, [playerBreakdown]);

  const pieData = useMemo(() => {
    return reasonBreakdown.map(reason => ({
      name: reason.reasonName,
      value: reason.count,
      amount: reason.totalAmount
    }));
  }, [reasonBreakdown]);

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
            Comprehensive insights into team fines and player behavior
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" />
                Custom Range
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={setDateRange}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
          <Button
            variant="outline"
            onClick={() => handleExportReport('summary')}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {summaryData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Fines</p>
                  <p className="text-2xl font-bold">{summaryData.totalFines}</p>
                </div>
                <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <AlertCircle className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Amount</p>
                  <p className="text-2xl font-bold">${summaryData.totalAmount.toFixed(2)}</p>
                </div>
                <div className="h-12 w-12 bg-success/10 rounded-lg flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Players Fined</p>
                  <p className="text-2xl font-bold">{summaryData.uniquePlayers}</p>
                </div>
                <div className="h-12 w-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
                  <Users className="h-6 w-6 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Average Fine</p>
                  <p className="text-2xl font-bold">${summaryData.averageFineAmount.toFixed(2)}</p>
                </div>
                <div className="h-12 w-12 bg-amber-500/10 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-amber-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Key Insights */}
      {summaryData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Key Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Most Common Violation</Label>
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-500" />
                  <span className="font-medium">{summaryData.mostCommonReason}</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Highest Fined Player</Label>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-destructive" />
                  <span className="font-medium">{summaryData.highestFinedPlayer}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="player-breakdown" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="player-breakdown" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Player Breakdown
          </TabsTrigger>
          <TabsTrigger value="reason-breakdown" className="flex items-center gap-2">
            <PieChartIcon className="h-4 w-4" />
            Reason Breakdown  
          </TabsTrigger>
          <TabsTrigger value="trends" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Trends
          </TabsTrigger>
        </TabsList>

        <TabsContent value="player-breakdown" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Fine Amount by Player</CardTitle>
                <CardDescription>Total fine amounts per player</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      angle={-45}
                      textAnchor="end"
                      height={100}
                      fontSize={12}
                    />
                    <YAxis />
                    <Tooltip 
                      formatter={(value, name) => [
                        `$${Number(value).toFixed(2)}`, 
                        name === 'amount' ? 'Total Amount' : 'Total Fines'
                      ]}
                    />
                    <Bar dataKey="amount" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Player Rankings</CardTitle>
                <CardDescription>Top players by total fine amount</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {playerBreakdown.slice(0, 10).map((player, index) => (
                    <div key={player.playerName} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                          <span className="text-xs font-bold">#{index + 1}</span>
                        </div>
                        <div>
                          <p className="font-medium">{player.playerName}</p>
                          <p className="text-sm text-muted-foreground">
                            Jersey #{player.jerseyNumber} • {player.totalFines} fines
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="destructive" className="font-mono">
                          ${player.totalAmount.toFixed(2)}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          Avg: ${player.averageAmount.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="reason-breakdown" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Fine Distribution by Reason</CardTitle>
                <CardDescription>Percentage breakdown of fine reasons</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%" 
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} fines`]} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Reason Analysis</CardTitle>
                <CardDescription>Detailed breakdown by fine reason</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reasonBreakdown.map((reason, index) => (
                    <div key={reason.reasonName} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <span className="font-medium">{reason.reasonName}</span>
                        </div>
                        <Badge variant="secondary">{reason.count} fines</Badge>
                      </div>
                      <div className="pl-5 space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Total Amount:</span>
                          <span className="font-mono">${reason.totalAmount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Average:</span>
                          <span className="font-mono">${reason.averageAmount.toFixed(2)}</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full" 
                            style={{ width: `${reason.percentage}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Fine Trends Over Time</CardTitle>
              <CardDescription>Track fine patterns and frequency over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Trend analysis will be available with more data</p>
                  <p className="text-sm">Continue recording fines to see patterns over time</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Export Options */}
      <Card>
        <CardHeader>
          <CardTitle>Export Reports</CardTitle>
          <CardDescription>Download detailed reports for external analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button 
              variant="outline" 
              onClick={() => handleExportReport('summary')}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export Summary Report
            </Button>
            <Button 
              variant="outline"
              onClick={() => handleExportReport('detailed')}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export Detailed Report
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}