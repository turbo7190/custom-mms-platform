import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert,
} from "@mui/material";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import axios from "axios";

const Analytics: React.FC = () => {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState("30");
  const [groupBy, setGroupBy] = useState("day");

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange, groupBy]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(dateRange));

      const [dashboardRes, messagesRes, templatesRes, complianceRes] =
        await Promise.all([
          axios.get("/api/analytics/dashboard"),
          axios.get(
            `/api/analytics/messages?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}&groupBy=${groupBy}`
          ),
          axios.get(
            `/api/analytics/templates?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
          ),
          axios.get(
            `/api/analytics/compliance?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
          ),
        ]);

      setAnalytics({
        dashboard: dashboardRes.data,
        messages: messagesRes.data,
        templates: templatesRes.data,
        compliance: complianceRes.data,
      });
    } catch (error: any) {
      setError(error.response?.data?.message || "Failed to fetch analytics");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: any) => {
    if (date.year && date.month && date.day) {
      return `${date.month}/${date.day}`;
    }
    if (date.year && date.month) {
      return `${date.year}-${date.month.toString().padStart(2, "0")}`;
    }
    if (date.year && date.week) {
      return `Week ${date.week}, ${date.year}`;
    }
    return date.toString();
  };

  const pieData = analytics?.dashboard
    ? [
        {
          name: "Delivered",
          value: analytics.dashboard.messages.deliveredMessages,
          color: "#4caf50",
        },
        {
          name: "Failed",
          value: analytics.dashboard.messages.failedMessages,
          color: "#f44336",
        },
        {
          name: "Pending",
          value: analytics.dashboard.messages.pendingMessages,
          color: "#ff9800",
        },
      ]
    : [];

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 3 }}
      >
        <Typography variant="h4" component="h1">
          Analytics
        </Typography>
        <Box display="flex" gap={2}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Date Range</InputLabel>
            <Select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              label="Date Range"
            >
              <MenuItem value="7">Last 7 days</MenuItem>
              <MenuItem value="30">Last 30 days</MenuItem>
              <MenuItem value="90">Last 90 days</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Group By</InputLabel>
            <Select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value)}
              label="Group By"
            >
              <MenuItem value="hour">Hour</MenuItem>
              <MenuItem value="day">Day</MenuItem>
              <MenuItem value="week">Week</MenuItem>
              <MenuItem value="month">Month</MenuItem>
            </Select>
          </FormControl>
          <Button variant="outlined" onClick={fetchAnalytics}>
            Refresh
          </Button>
        </Box>
      </Box>

      {/* Message Volume Chart */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Message Volume Over Time
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analytics?.messages || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="_id" tickFormatter={formatDate} />
                  <YAxis />
                  <Tooltip
                    labelFormatter={(value) => `Date: ${formatDate(value)}`}
                  />
                  <Line
                    type="monotone"
                    dataKey="total"
                    stroke="#2196f3"
                    strokeWidth={2}
                    name="Total Messages"
                  />
                  <Line
                    type="monotone"
                    dataKey="delivered"
                    stroke="#4caf50"
                    strokeWidth={2}
                    name="Delivered"
                  />
                  <Line
                    type="monotone"
                    dataKey="failed"
                    stroke="#f44336"
                    strokeWidth={2}
                    name="Failed"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Message Status Distribution
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Template Performance */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Template Performance
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics?.templates || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    angle={-45}
                    textAnchor="end"
                    height={100}
                  />
                  <YAxis />
                  <Tooltip />
                  <Bar
                    dataKey="totalSent"
                    fill="#2196f3"
                    name="Messages Sent"
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Template Success Rates
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics?.templates || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    angle={-45}
                    textAnchor="end"
                    height={100}
                  />
                  <YAxis />
                  <Tooltip />
                  <Bar
                    dataKey="successRate"
                    fill="#4caf50"
                    name="Success Rate (%)"
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Compliance Analytics */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Compliance Rates
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={[
                    {
                      name: "Age Verification",
                      rate:
                        analytics?.compliance?.rates?.ageVerificationRate || 0,
                    },
                    {
                      name: "Consent Verification",
                      rate:
                        analytics?.compliance?.rates?.consentVerificationRate ||
                        0,
                    },
                    {
                      name: "Content Screening",
                      rate:
                        analytics?.compliance?.rates?.contentScreeningRate || 0,
                    },
                    {
                      name: "Disclaimers",
                      rate:
                        analytics?.compliance?.rates?.disclaimerInclusionRate ||
                        0,
                    },
                  ]}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar
                    dataKey="rate"
                    fill="#ff9800"
                    name="Compliance Rate (%)"
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Template Usage by Category
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analytics?.dashboard?.templateStats || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="totalSent"
                    nameKey="_id"
                  >
                    {analytics?.dashboard?.templateStats?.map(
                      (entry: any, index: number) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={`hsl(${index * 60}, 70%, 50%)`}
                        />
                      )
                    )}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Detailed Template Performance Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Template Performance Details
          </Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Template Name</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Total Sent</TableCell>
                  <TableCell>Delivered</TableCell>
                  <TableCell>Failed</TableCell>
                  <TableCell>Success Rate</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {analytics?.templates?.map((template: any) => (
                  <TableRow key={template._id}>
                    <TableCell>{template.name}</TableCell>
                    <TableCell>{template.category}</TableCell>
                    <TableCell>{template.totalSent}</TableCell>
                    <TableCell>{template.delivered}</TableCell>
                    <TableCell>{template.failed}</TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <Box
                          sx={{
                            width: 100,
                            height: 8,
                            bgcolor: "grey.200",
                            borderRadius: 4,
                            mr: 1,
                          }}
                        >
                          <Box
                            sx={{
                              width: `${template.successRate}%`,
                              height: "100%",
                              bgcolor:
                                template.successRate > 80
                                  ? "success.main"
                                  : template.successRate > 60
                                  ? "warning.main"
                                  : "error.main",
                              borderRadius: 4,
                            }}
                          />
                        </Box>
                        {template.successRate.toFixed(1)}%
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Analytics;
