import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
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
  LinearProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import {
  Security as SecurityIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
} from "@mui/icons-material";
import axios from "axios";

const Compliance: React.FC = () => {
  const [complianceStatus, setComplianceStatus] = useState<any>(null);
  const [violations, setViolations] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [violationType, setViolationType] = useState("all");

  useEffect(() => {
    fetchComplianceData();
  }, [violationType]);

  const fetchComplianceData = async () => {
    try {
      setLoading(true);
      const [statusRes, violationsRes, recommendationsRes] = await Promise.all([
        axios.get("/api/compliance/status"),
        axios.get(`/api/compliance/violations?type=${violationType}`),
        axios.get("/api/compliance/recommendations"),
      ]);

      setComplianceStatus(statusRes.data);
      setViolations(violationsRes.data.violations);
      setRecommendations(recommendationsRes.data);
    } catch (error: any) {
      setError(
        error.response?.data?.message || "Failed to fetch compliance data"
      );
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "compliant":
        return <CheckCircleIcon color="success" />;
      case "warning":
        return <WarningIcon color="warning" />;
      case "violation":
        return <ErrorIcon color="error" />;
      case "suspended":
        return <ErrorIcon color="error" />;
      default:
        return <SecurityIcon color="action" />;
    }
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

  const getViolationTypeLabel = (type: string) => {
    switch (type) {
      case "age_verification":
        return "Age Verification";
      case "consent":
        return "Consent";
      case "content":
        return "Content Screening";
      case "disclaimers":
        return "Disclaimers";
      default:
        return "All";
    }
  };

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
          Compliance Dashboard
        </Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchComplianceData}
            sx={{ mr: 2 }}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<SettingsIcon />}
            onClick={() => setSettingsDialogOpen(true)}
          >
            Settings
          </Button>
        </Box>
      </Box>

      {/* Compliance Status Overview */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" sx={{ mb: 2 }}>
                {getStatusIcon(complianceStatus?.overallStatus)}
                <Typography variant="h6" sx={{ ml: 1 }}>
                  Overall Status
                </Typography>
              </Box>
              <Chip
                label={complianceStatus?.overallStatus || "Unknown"}
                color={getStatusColor(complianceStatus?.overallStatus) as any}
                variant="outlined"
                sx={{ mb: 2 }}
              />
              <Typography variant="body2" color="text.secondary">
                Last checked:{" "}
                {complianceStatus?.lastCheck
                  ? new Date(complianceStatus.lastCheck).toLocaleString()
                  : "Never"}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Age Verification Rate
              </Typography>
              <Box display="flex" alignItems="center" sx={{ mb: 1 }}>
                <Typography variant="h4" color="primary">
                  {complianceStatus?.settings?.ageVerificationRequired
                    ? "100%"
                    : "0%"}
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={
                  complianceStatus?.settings?.ageVerificationRequired ? 100 : 0
                }
                sx={{ height: 8, borderRadius: 4 }}
              />
              <Typography variant="caption" color="text.secondary">
                {complianceStatus?.settings?.ageVerificationRequired
                  ? "Required"
                  : "Not Required"}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Consent Verification Rate
              </Typography>
              <Box display="flex" alignItems="center" sx={{ mb: 1 }}>
                <Typography variant="h4" color="primary">
                  {complianceStatus?.settings?.consentRequired ? "100%" : "0%"}
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={complianceStatus?.settings?.consentRequired ? 100 : 0}
                sx={{ height: 8, borderRadius: 4 }}
              />
              <Typography variant="caption" color="text.secondary">
                {complianceStatus?.settings?.consentRequired
                  ? "Required"
                  : "Not Required"}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Compliance Settings */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Current Settings
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  sx={{ mb: 2 }}
                >
                  <Typography variant="body2">
                    Age Verification Required
                  </Typography>
                  <Chip
                    label={
                      complianceStatus?.settings?.ageVerificationRequired
                        ? "Yes"
                        : "No"
                    }
                    color={
                      complianceStatus?.settings?.ageVerificationRequired
                        ? "success"
                        : "default"
                    }
                    size="small"
                  />
                </Box>
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  sx={{ mb: 2 }}
                >
                  <Typography variant="body2">Consent Required</Typography>
                  <Chip
                    label={
                      complianceStatus?.settings?.consentRequired ? "Yes" : "No"
                    }
                    color={
                      complianceStatus?.settings?.consentRequired
                        ? "success"
                        : "default"
                    }
                    size="small"
                  />
                </Box>
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  sx={{ mb: 2 }}
                >
                  <Typography variant="body2">Max Messages Per Day</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {complianceStatus?.settings?.maxMessagesPerDay ||
                      "Unlimited"}
                  </Typography>
                </Box>
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Typography variant="body2">Restricted Keywords</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {complianceStatus?.settings?.restrictedKeywords?.length ||
                      0}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recommendations
              </Typography>
              {recommendations.length > 0 ? (
                <Box sx={{ mt: 2 }}>
                  {recommendations.map((rec, index) => (
                    <Box
                      key={index}
                      sx={{ mb: 2, p: 2, bgcolor: "grey.50", borderRadius: 1 }}
                    >
                      <Box display="flex" alignItems="center" sx={{ mb: 1 }}>
                        <Chip
                          label={rec.priority}
                          color={rec.priority === "high" ? "error" : "warning"}
                          size="small"
                          sx={{ mr: 1 }}
                        />
                        <Typography variant="subtitle2">
                          {rec.type.replace("_", " ").toUpperCase()}
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        {rec.message}
                      </Typography>
                      {rec.currentRate && (
                        <Typography variant="caption" color="text.secondary">
                          Current rate: {rec.currentRate}%
                        </Typography>
                      )}
                    </Box>
                  ))}
                </Box>
              ) : (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 2 }}
                >
                  No recommendations at this time
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Violations Table */}
      <Card>
        <CardContent>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            sx={{ mb: 2 }}
          >
            <Typography variant="h6">Recent Violations</Typography>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Violation Type</InputLabel>
              <Select
                value={violationType}
                onChange={(e) => setViolationType(e.target.value)}
                label="Violation Type"
              >
                <MenuItem value="all">All Types</MenuItem>
                <MenuItem value="age_verification">Age Verification</MenuItem>
                <MenuItem value="consent">Consent</MenuItem>
                <MenuItem value="content">Content Screening</MenuItem>
                <MenuItem value="disclaimers">Disclaimers</MenuItem>
              </Select>
            </FormControl>
          </Box>
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Phone Number</TableCell>
                  <TableCell>Violation Type</TableCell>
                  <TableCell>Message</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {violations.map((violation) => (
                  <TableRow key={violation._id}>
                    <TableCell>{violation.recipient.phoneNumber}</TableCell>
                    <TableCell>
                      <Chip
                        label={getViolationTypeLabel(violation.violation)}
                        size="small"
                        color="error"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                        {violation.content.text}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {new Date(violation.timestamp).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={violation.delivery.status}
                        color={getStatusColor(violation.delivery.status) as any}
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Settings Dialog */}
      <Dialog
        open={settingsDialogOpen}
        onClose={() => setSettingsDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Compliance Settings</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={
                      complianceStatus?.settings?.ageVerificationRequired ||
                      false
                    }
                    onChange={(e) => {
                      // In production, this would update the settings
                      console.log(
                        "Age verification required:",
                        e.target.checked
                      );
                    }}
                  />
                }
                label="Require Age Verification"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={
                      complianceStatus?.settings?.consentRequired || false
                    }
                    onChange={(e) => {
                      // In production, this would update the settings
                      console.log("Consent required:", e.target.checked);
                    }}
                  />
                }
                label="Require Consent Verification"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Max Messages Per Day"
                type="number"
                value={complianceStatus?.settings?.maxMessagesPerDay || ""}
                onChange={(e) => {
                  // In production, this would update the settings
                  console.log("Max messages per day:", e.target.value);
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Opt-out Message"
                multiline
                rows={2}
                value={complianceStatus?.settings?.optOutMessage || ""}
                onChange={(e) => {
                  // In production, this would update the settings
                  console.log("Opt-out message:", e.target.value);
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSettingsDialogOpen(false)}>Cancel</Button>
          <Button variant="contained">Save Settings</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Compliance;
