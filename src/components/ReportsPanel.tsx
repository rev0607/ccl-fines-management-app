"use client";

import React, { useState, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import { 
  ChartBar, 
  ChartColumnBig, 
  FileChartColumn, 
  FileChartLine, 
  FileChartPie,
  TableOfContents,
  Section,
  ChartNoAxesCombined,
  PanelTop
} from "lucide-react";
import { toast } from "sonner";

// Mock data for demonstration
const mockFinesData = [
  { id: 1, playerName: "John Smith", amount: 250, reason: "Late arrival", date: "2024-01-15", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face" },
  { id: 2, playerName: "Mike Johnson", amount: 180, reason: "Missed training", date: "2024-01-16", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face" },
  { id: 3, playerName: "David Wilson", amount: 320, reason: "Equipment violation", date: "2024-01-17", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=40&h=40&fit=crop&crop=face" },
  { id: 4, playerName: "Chris Brown", amount: 150, reason: "Late arrival", date: "2024-01-18", avatar: "https://images.unsplash.com/photo-1519244703995-f4e0f30006d5?w=40&h=40&fit=crop&crop=face" },
  { id: 5, playerName: "Alex Davis", amount: 100, reason: "Uniform issue", date: "2024-01-19", avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=40&h=40&fit=crop&crop=face" },
];

type TimePeriod = "weekly" | "monthly" | "quarterly" | "half-yearly" | "yearly" | "custom";
type ActiveTab = "summary" | "visualization" | "breakdown";

interface ReportsPanelProps {
  className?: string;
}

export default function ReportsPanel({ className }: ReportsPanelProps) {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("monthly");
  const [activeTab, setActiveTab] = useState<ActiveTab>("summary");
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [expandedRows, setExpandedRows] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Computed statistics
  const stats = useMemo(() => {
    const totalAmount = mockFinesData.reduce((sum, fine) => sum + fine.amount, 0);
    const totalCount = mockFinesData.length;
    
    // Top players by total fines
    const playerTotals = mockFinesData.reduce((acc, fine) => {
      acc[fine.playerName] = (acc[fine.playerName] || 0) + fine.amount;
      return acc;
    }, {} as Record<string, number>);
    
    const topPlayers = Object.entries(playerTotals)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([name, total]) => {
        const player = mockFinesData.find(f => f.playerName === name);
        return { name, total, avatar: player?.avatar };
      });

    // Top reasons
    const reasonTotals = mockFinesData.reduce((acc, fine) => {
      acc[fine.reason] = (acc[fine.reason] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const topReasons = Object.entries(reasonTotals)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3);

    // Leaderboard
    const leaderboard = Object.entries(playerTotals)
      .sort(([,a], [,b]) => b - a)
      .map(([name, total], index) => {
        const player = mockFinesData.find(f => f.playerName === name);
        return { rank: index + 1, name, total, avatar: player?.avatar };
      });

    // Fun badges
    const serialOffender = topPlayers[0]?.name || "";
    const disciplinedPlayer = leaderboard[leaderboard.length - 1]?.name || "";

    return {
      totalAmount,
      totalCount,
      topPlayers,
      topReasons,
      leaderboard,
      serialOffender,
      disciplinedPlayer
    };
  }, []);

  const handleExport = (type: "excel" | "pdf", section: string) => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success(`${section} exported as ${type.toUpperCase()}`);
    }, 1000);
  };

  const handleChartClick = (player?: string, reason?: string) => {
    setSelectedPlayer(player || null);
    setSelectedReason(reason || null);
    setActiveTab("breakdown");
  };

  const toggleRow = (id: string) => {
    setExpandedRows(prev => 
      prev.includes(id) 
        ? prev.filter(rowId => rowId !== id)
        : [...prev, id]
    );
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Time Period Selector */}
      <Card className="bg-card">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Section className="h-5 w-5" />
                Reports & Analytics
              </CardTitle>
              <CardDescription>
                Comprehensive insights into team fines and performance
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">Time Period:</span>
              <Select value={timePeriod} onValueChange={(value) => setTimePeriod(value as TimePeriod)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="half-yearly">Half-Yearly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as ActiveTab)} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="summary" className="flex items-center gap-2">
            <PanelTop className="h-4 w-4" />
            Summary
          </TabsTrigger>
          <TabsTrigger value="visualization" className="flex items-center gap-2">
            <ChartNoAxesCombined className="h-4 w-4" />
            Visualization
          </TabsTrigger>
          <TabsTrigger value="breakdown" className="flex items-center gap-2">
            <TableOfContents className="h-4 w-4" />
            Breakdown
          </TabsTrigger>
        </TabsList>

        {/* Summary Tab */}
        <TabsContent value="summary" className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Collected</CardDescription>
                <CardTitle className="text-2xl">${stats.totalAmount}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">{stats.totalCount} fines issued</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Average Fine</CardDescription>
                <CardTitle className="text-2xl">${Math.round(stats.totalAmount / stats.totalCount)}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">Per incident</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Most Common</CardDescription>
                <CardTitle className="text-lg">{stats.topReasons[0]?.[0]}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">{stats.topReasons[0]?.[1]} incidents</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Top Offender</CardDescription>
                <CardTitle className="text-lg">{stats.topPlayers[0]?.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">${stats.topPlayers[0]?.total} total</p>
              </CardContent>
            </Card>
          </div>

          {/* Top Players & Reasons */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Top 3 Fined Players</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {stats.topPlayers.map((player, index) => (
                  <div key={player.name} className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-sm font-medium">
                      {index + 1}
                    </div>
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={player.avatar} alt={player.name} />
                      <AvatarFallback>{player.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium">{player.name}</p>
                      <p className="text-sm text-muted-foreground">${player.total} total</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top 3 Fine Reasons</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {stats.topReasons.map(([reason, count], index) => (
                  <div key={reason} className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-sm font-medium">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{reason}</p>
                      <p className="text-sm text-muted-foreground">{count} incidents</p>
                    </div>
                    <Badge variant="secondary">{count}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Fun Badges */}
          <Card>
            <CardHeader>
              <CardTitle>Team Awards</CardTitle>
              <CardDescription>Fun recognitions based on fine patterns</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-4">
                <Badge variant="destructive" className="text-base px-4 py-2">
                  🚨 Serial Offender: {stats.serialOffender}
                </Badge>
                <Badge variant="secondary" className="text-base px-4 py-2">
                  😇 Most Disciplined: {stats.disciplinedPlayer}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Leaderboard */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Fines Leaderboard</CardTitle>
                <CardDescription>All players ranked by total fine amounts</CardDescription>
              </div>
              <Button 
                variant="outline" 
                onClick={() => handleExport("excel", "Summary")}
                disabled={loading}
              >
                Export Summary
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Rank</TableHead>
                    <TableHead>Player</TableHead>
                    <TableHead className="text-right">Total Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.leaderboard.map((player) => (
                    <TableRow key={player.name}>
                      <TableCell className="font-medium">#{player.rank}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={player.avatar} alt={player.name} />
                            <AvatarFallback>{player.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                          </Avatar>
                          {player.name}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">${player.total}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Visualization Tab */}
        <TabsContent value="visualization" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleChartClick()}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ChartBar className="h-5 w-5" />
                  Fines Per Player
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center bg-muted rounded-lg">
                  <div className="text-center">
                    <ChartColumnBig className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Interactive Bar Chart</p>
                    <p className="text-xs text-muted-foreground">Click to filter breakdown</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleChartClick()}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileChartPie className="h-5 w-5" />
                  Reason Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center bg-muted rounded-lg">
                  <div className="text-center">
                    <FileChartPie className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Interactive Pie Chart</p>
                    <p className="text-xs text-muted-foreground">Click to filter breakdown</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2 cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleChartClick()}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileChartLine className="h-5 w-5" />
                  Trend Over Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center bg-muted rounded-lg">
                  <div className="text-center">
                    <FileChartLine className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Interactive Line Chart</p>
                    <p className="text-xs text-muted-foreground">Shows fine trends over selected time period</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Chart Filters</CardTitle>
              <CardDescription>Customize your visualization view</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Player Filter</label>
                  <Select>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="All players" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All players</SelectItem>
                      {Array.from(new Set(mockFinesData.map(f => f.playerName))).map(name => (
                        <SelectItem key={name} value={name}>{name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Reason Filter</label>
                  <Select>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="All reasons" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All reasons</SelectItem>
                      {Array.from(new Set(mockFinesData.map(f => f.reason))).map(reason => (
                        <SelectItem key={reason} value={reason}>{reason}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button variant="outline" onClick={() => handleExport("pdf", "Charts")}>
                  Export Charts
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Breakdown Tab */}
        <TabsContent value="breakdown" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Detailed Breakdown</CardTitle>
                <CardDescription>
                  Drill down into fine details
                  {selectedPlayer && <Badge className="ml-2">Player: {selectedPlayer}</Badge>}
                  {selectedReason && <Badge className="ml-2">Reason: {selectedReason}</Badge>}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                {(selectedPlayer || selectedReason) && (
                  <Button 
                    variant="outline" 
                    onClick={() => { setSelectedPlayer(null); setSelectedReason(null); }}
                  >
                    Clear Filters
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  onClick={() => handleExport("excel", "Breakdown")}
                  disabled={loading}
                >
                  Export Breakdown
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Group by Player */}
                <Collapsible>
                  <CollapsibleTrigger 
                    className="flex items-center justify-between w-full p-4 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
                    onClick={() => toggleRow("players")}
                  >
                    <span className="font-medium">Group by Player</span>
                    <ChartBar className="h-4 w-4" />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-2">
                    <div className="border rounded-lg">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Player</TableHead>
                            <TableHead>Fine Count</TableHead>
                            <TableHead className="text-right">Total Amount</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {stats.leaderboard.map((player) => (
                            <TableRow key={player.name}>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-8 w-8">
                                    <AvatarImage src={player.avatar} alt={player.name} />
                                    <AvatarFallback>{player.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                                  </Avatar>
                                  {player.name}
                                </div>
                              </TableCell>
                              <TableCell>{mockFinesData.filter(f => f.playerName === player.name).length}</TableCell>
                              <TableCell className="text-right font-medium">${player.total}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                <Separator />

                {/* Group by Reason */}
                <Collapsible>
                  <CollapsibleTrigger 
                    className="flex items-center justify-between w-full p-4 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
                    onClick={() => toggleRow("reasons")}
                  >
                    <span className="font-medium">Group by Reason</span>
                    <FileChartColumn className="h-4 w-4" />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-2">
                    <div className="border rounded-lg">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Reason</TableHead>
                            <TableHead>Incident Count</TableHead>
                            <TableHead className="text-right">Total Amount</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {stats.topReasons.map(([reason, count]) => {
                            const reasonTotal = mockFinesData
                              .filter(f => f.reason === reason)
                              .reduce((sum, f) => sum + f.amount, 0);
                            return (
                              <TableRow key={reason}>
                                <TableCell className="font-medium">{reason}</TableCell>
                                <TableCell>{count}</TableCell>
                                <TableCell className="text-right font-medium">${reasonTotal}</TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                <Separator />

                {/* Individual Fines */}
                <div className="space-y-2">
                  <h4 className="font-medium">All Fine Records</h4>
                  <div className="border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Player</TableHead>
                          <TableHead>Reason</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {mockFinesData
                          .filter(fine => !selectedPlayer || fine.playerName === selectedPlayer)
                          .filter(fine => !selectedReason || fine.reason === selectedReason)
                          .map((fine) => (
                          <TableRow key={fine.id}>
                            <TableCell>{new Date(fine.date).toLocaleDateString()}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Avatar className="h-6 w-6">
                                  <AvatarImage src={fine.avatar} alt={fine.playerName} />
                                  <AvatarFallback>{fine.playerName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                                </Avatar>
                                {fine.playerName}
                              </div>
                            </TableCell>
                            <TableCell>{fine.reason}</TableCell>
                            <TableCell className="text-right font-medium">${fine.amount}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}