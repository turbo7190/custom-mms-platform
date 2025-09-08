import React, { useState, useEffect } from "react";
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Chip,
  LinearProgress,
} from "@mui/material";
import {
  Message as MessageIcon,
  Template as TemplateIcon,
  TrendingUp as TrendingUpIcon,
  Security as SecurityIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
} from "@mui/icons-material";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";

interface DashboardStats {
  messages: {
    totalMessages: number;
    sentMessages: number;
    deliveredMessages: number;
    failedMessages: number;
    pendingMessages: number;
  };
  dailyStats: Array<{
    _id: { year: number; month: number; day: number };
    count: number;
    delivered: number;
  }>;
  templateStats: Array<{
    _id: string;
    count: number;
    totalSent: number;
  }>;
  compliance: {
    ageVerified: number;
    consentVerified: number;
    contentScreened: number;
  };
  topTemplates: Array<{
    name: string;
    category: string;
    usage: { totalSent: number; successRate: number };
  }>;
  deliveryRate: string;
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { client } = useAuth();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/analytics/dashboard");
      setStats(response.data);
    } catch (error: any) {
      setError(
        error.response?.data?.message || "Failed to fetch dashboard data"
      );
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: { year: number; month: number; day: number }) => {
    return `${date.month}/${date.day}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "compliant":
        return "success";
      case "warning":
        return "warning";
      case "violation":
        return "error";
      case "suspended":
        return "error";
      default:
        return "default";
    }
  };

  const pieData = stats
    ? [
        {
          name: "Delivered",
          value: stats.messages.deliveredMessages,
          color: "#4caf50",
        },
        {
          name: "Failed",
          value: stats.messages.failedMessages,
          color: "#f44336",
        },
        {
          name: "Pending",
          value: stats.messages.pendingMessages,
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
      <Typography variant="h4" component="h1" gutterBottom>
        Dashboard
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Welcome back! Here's an overview of your MMS platform activity.
      </Typography>

      {/* Business Status */}
      {client && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
            >
              <Box>
                <Typography variant="h6" gutterBottom>
                  {client.businessName}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {client.businessType.charAt(0).toUpperCase() +
                    client.businessType.slice(1)}{" "}
                  Business
                </Typography>
              </Box>
              <Box textAlign="right">
                <Chip
                  label={client.complianceStatus}
                  color={getStatusColor(client.complianceStatus) as any}
                  variant="outlined"
                />
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 1 }}
                >
                  Plan: {client.subscription.plan}
                </Typography>
              </Box>
            </Box>
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Messages Used: {client.subscription.messagesUsed} /{" "}
                {client.subscription.messagesLimit}
              </Typography>
              <LinearProgress
                variant="determinate"
                value={
                  (client.subscription.messagesUsed /
                    client.subscription.messagesLimit) *
                  100
                }
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <MessageIcon color="primary" sx={{ mr: 2, fontSize: 40 }} />
                <Box>
                  <Typography variant="h4" component="div">
                    {stats?.messages.totalMessages || 0}
                  </Typography>
                  <Typography color="text.secondary">Total Messages</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <CheckCircleIcon color="success" sx={{ mr: 2, fontSize: 40 }} />
                <Box>
                  <Typography variant="h4" component="div">
                    {stats?.messages.deliveredMessages || 0}
                  </Typography>
                  <Typography color="text.secondary">Delivered</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <TemplateIcon color="info" sx={{ mr: 2, fontSize: 40 }} />
                <Box>
                  <Typography variant="h4" component="div">
                    {stats?.templateStats.length || 0}
                  </Typography>
                  <Typography color="text.secondary">Templates</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <TrendingUpIcon
                  color="secondary"
                  sx={{ mr: 2, fontSize: 40 }}
                />
                <Box>
                  <Typography variant="h4" component="div">
                    {stats?.deliveryRate || 0}%
                  </Typography>
                  <Typography color="text.secondary">Delivery Rate</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Message Activity (Last 30 Days)
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={stats?.dailyStats || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="_id" tickFormatter={formatDate} />
                  <YAxis />
                  <Tooltip
                    labelFormatter={(value) => `Date: ${formatDate(value)}`}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
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
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Message Status
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

      {/* Compliance Overview */}
      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Compliance Overview
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  sx={{ mb: 1 }}
                >
                  <Typography variant="body2">Age Verification</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {stats?.compliance.ageVerified || 0}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={stats?.compliance.ageVerified || 0}
                  sx={{ mb: 2 }}
                />

                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  sx={{ mb: 1 }}
                >
                  <Typography variant="body2">Consent Verification</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {stats?.compliance.consentVerified || 0}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={stats?.compliance.consentVerified || 0}
                  sx={{ mb: 2 }}
                />

                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  sx={{ mb: 1 }}
                >
                  <Typography variant="body2">Content Screening</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {stats?.compliance.contentScreened || 0}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={stats?.compliance.contentScreened || 0}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Top Templates
              </Typography>
              {stats?.topTemplates.length ? (
                <Box sx={{ mt: 2 }}>
                  {stats.topTemplates.slice(0, 5).map((template, index) => (
                    <Box
                      key={index}
                      display="flex"
                      justifyContent="space-between"
                      alignItems="center"
                      sx={{ mb: 1 }}
                    >
                      <Box>
                        <Typography variant="body2" fontWeight="bold">
                          {template.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {template.category}
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="primary">
                        {template.usage.totalSent} sent
                      </Typography>
                    </Box>
                  ))}
                </Box>
              ) : (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 2 }}
                >
                  No templates created yet
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
