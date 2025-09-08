import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
} from "@mui/material";
import {
  Save as SaveIcon,
  Refresh as RefreshIcon,
  Security as SecurityIcon,
  Message as MessageIcon,
  Business as BusinessIcon,
} from "@mui/icons-material";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";

const Settings: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const { client, user } = useAuth();

  const [profileData, setProfileData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
  });

  const [businessData, setBusinessData] = useState({
    businessName: client?.businessName || "",
    businessType: client?.businessType || "",
    phone: "",
    email: "",
    address: {
      street: "",
      city: "",
      state: "",
      zipCode: "",
    },
  });

  const [mmsSettings, setMmsSettings] = useState({
    provider: "twilio",
    accountSid: "",
    authToken: "",
    fromNumber: "",
    dailyLimit: 1000,
    monthlyLimit: 10000,
  });

  const [complianceSettings, setComplianceSettings] = useState({
    ageVerificationRequired: true,
    consentRequired: true,
    maxMessagesPerDay: 5,
    optOutMessage: "Reply STOP to opt out of messages. Reply HELP for help.",
    restrictedKeywords: [] as string[],
    requiredDisclaimers: [] as string[],
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      // In production, fetch actual settings from API
      setBusinessData({
        businessName: client?.businessName || "",
        businessType: client?.businessType || "",
        phone: "",
        email: "",
        address: {
          street: "",
          city: "",
          state: "",
          zipCode: "",
        },
      });
    } catch (error: any) {
      setError(error.response?.data?.message || "Failed to fetch settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      await axios.put("/api/auth/profile", profileData);
      setSuccess("Profile updated successfully");
    } catch (error: any) {
      setError(error.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveBusiness = async () => {
    try {
      setSaving(true);
      await axios.put(`/api/clients/${client?.id}`, businessData);
      setSuccess("Business information updated successfully");
    } catch (error: any) {
      setError(
        error.response?.data?.message || "Failed to update business information"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleSaveMmsSettings = async () => {
    try {
      setSaving(true);
      await axios.put(`/api/clients/${client?.id}/mms-settings`, mmsSettings);
      setSuccess("MMS settings updated successfully");
    } catch (error: any) {
      setError(
        error.response?.data?.message || "Failed to update MMS settings"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleSaveComplianceSettings = async () => {
    try {
      setSaving(true);
      await axios.put(
        `/api/clients/${client?.id}/compliance-settings`,
        complianceSettings
      );
      setSuccess("Compliance settings updated successfully");
    } catch (error: any) {
      setError(
        error.response?.data?.message || "Failed to update compliance settings"
      );
    } finally {
      setSaving(false);
    }
  };

  const businessTypes = [
    { value: "cannabis", label: "Cannabis Dispensary" },
    { value: "vape", label: "Vape Shop" },
    { value: "cbd", label: "CBD Store" },
    { value: "tobacco", label: "Tobacco Shop" },
    { value: "other", label: "Other" },
  ];

  const mmsProviders = [
    { value: "twilio", label: "Twilio" },
    { value: "bandwidth", label: "Bandwidth" },
    { value: "messagebird", label: "MessageBird" },
    { value: "custom", label: "Custom" },
  ];

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

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Settings
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert
          severity="success"
          sx={{ mb: 2 }}
          onClose={() => setSuccess(null)}
        >
          {success}
        </Alert>
      )}

      <Card>
        <CardContent>
          <Tabs
            value={tabValue}
            onChange={(e, newValue) => setTabValue(newValue)}
            sx={{ mb: 3 }}
          >
            <Tab icon={<BusinessIcon />} label="Profile" />
            <Tab icon={<BusinessIcon />} label="Business" />
            <Tab icon={<MessageIcon />} label="MMS Settings" />
            <Tab icon={<SecurityIcon />} label="Compliance" />
          </Tabs>

          {/* Profile Tab */}
          {tabValue === 0 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Personal Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="First Name"
                    value={profileData.firstName}
                    onChange={(e) =>
                      setProfileData({
                        ...profileData,
                        firstName: e.target.value,
                      })
                    }
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Last Name"
                    value={profileData.lastName}
                    onChange={(e) =>
                      setProfileData({
                        ...profileData,
                        lastName: e.target.value,
                      })
                    }
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Email"
                    type="email"
                    value={profileData.email}
                    onChange={(e) =>
                      setProfileData({ ...profileData, email: e.target.value })
                    }
                  />
                </Grid>
              </Grid>
              <Box sx={{ mt: 3 }}>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleSaveProfile}
                  disabled={saving}
                >
                  {saving ? <CircularProgress size={20} /> : "Save Profile"}
                </Button>
              </Box>
            </Box>
          )}

          {/* Business Tab */}
          {tabValue === 1 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Business Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Business Name"
                    value={businessData.businessName}
                    onChange={(e) =>
                      setBusinessData({
                        ...businessData,
                        businessName: e.target.value,
                      })
                    }
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Business Type</InputLabel>
                    <Select
                      value={businessData.businessType}
                      onChange={(e) =>
                        setBusinessData({
                          ...businessData,
                          businessType: e.target.value,
                        })
                      }
                      label="Business Type"
                    >
                      {businessTypes.map((type) => (
                        <MenuItem key={type.value} value={type.value}>
                          {type.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Phone Number"
                    value={businessData.phone}
                    onChange={(e) =>
                      setBusinessData({
                        ...businessData,
                        phone: e.target.value,
                      })
                    }
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Email"
                    type="email"
                    value={businessData.email}
                    onChange={(e) =>
                      setBusinessData({
                        ...businessData,
                        email: e.target.value,
                      })
                    }
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Street Address"
                    value={businessData.address.street}
                    onChange={(e) =>
                      setBusinessData({
                        ...businessData,
                        address: {
                          ...businessData.address,
                          street: e.target.value,
                        },
                      })
                    }
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="City"
                    value={businessData.address.city}
                    onChange={(e) =>
                      setBusinessData({
                        ...businessData,
                        address: {
                          ...businessData.address,
                          city: e.target.value,
                        },
                      })
                    }
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="State"
                    value={businessData.address.state}
                    onChange={(e) =>
                      setBusinessData({
                        ...businessData,
                        address: {
                          ...businessData.address,
                          state: e.target.value,
                        },
                      })
                    }
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="ZIP Code"
                    value={businessData.address.zipCode}
                    onChange={(e) =>
                      setBusinessData({
                        ...businessData,
                        address: {
                          ...businessData.address,
                          zipCode: e.target.value,
                        },
                      })
                    }
                  />
                </Grid>
              </Grid>
              <Box sx={{ mt: 3 }}>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleSaveBusiness}
                  disabled={saving}
                >
                  {saving ? (
                    <CircularProgress size={20} />
                  ) : (
                    "Save Business Info"
                  )}
                </Button>
              </Box>
            </Box>
          )}

          {/* MMS Settings Tab */}
          {tabValue === 2 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                MMS Provider Settings
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>MMS Provider</InputLabel>
                    <Select
                      value={mmsSettings.provider}
                      onChange={(e) =>
                        setMmsSettings({
                          ...mmsSettings,
                          provider: e.target.value,
                        })
                      }
                      label="MMS Provider"
                    >
                      {mmsProviders.map((provider) => (
                        <MenuItem key={provider.value} value={provider.value}>
                          {provider.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="From Number"
                    value={mmsSettings.fromNumber}
                    onChange={(e) =>
                      setMmsSettings({
                        ...mmsSettings,
                        fromNumber: e.target.value,
                      })
                    }
                    placeholder="+1234567890"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Account SID"
                    value={mmsSettings.accountSid}
                    onChange={(e) =>
                      setMmsSettings({
                        ...mmsSettings,
                        accountSid: e.target.value,
                      })
                    }
                    type="password"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Auth Token"
                    value={mmsSettings.authToken}
                    onChange={(e) =>
                      setMmsSettings({
                        ...mmsSettings,
                        authToken: e.target.value,
                      })
                    }
                    type="password"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Daily Limit"
                    type="number"
                    value={mmsSettings.dailyLimit}
                    onChange={(e) =>
                      setMmsSettings({
                        ...mmsSettings,
                        dailyLimit: parseInt(e.target.value),
                      })
                    }
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Monthly Limit"
                    type="number"
                    value={mmsSettings.monthlyLimit}
                    onChange={(e) =>
                      setMmsSettings({
                        ...mmsSettings,
                        monthlyLimit: parseInt(e.target.value),
                      })
                    }
                  />
                </Grid>
              </Grid>
              <Box sx={{ mt: 3 }}>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleSaveMmsSettings}
                  disabled={saving}
                >
                  {saving ? (
                    <CircularProgress size={20} />
                  ) : (
                    "Save MMS Settings"
                  )}
                </Button>
              </Box>
            </Box>
          )}

          {/* Compliance Settings Tab */}
          {tabValue === 3 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Compliance Settings
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={complianceSettings.ageVerificationRequired}
                        onChange={(e) =>
                          setComplianceSettings({
                            ...complianceSettings,
                            ageVerificationRequired: e.target.checked,
                          })
                        }
                      />
                    }
                    label="Require Age Verification"
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={complianceSettings.consentRequired}
                        onChange={(e) =>
                          setComplianceSettings({
                            ...complianceSettings,
                            consentRequired: e.target.checked,
                          })
                        }
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
                    value={complianceSettings.maxMessagesPerDay}
                    onChange={(e) =>
                      setComplianceSettings({
                        ...complianceSettings,
                        maxMessagesPerDay: parseInt(e.target.value),
                      })
                    }
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Opt-out Message"
                    value={complianceSettings.optOutMessage}
                    onChange={(e) =>
                      setComplianceSettings({
                        ...complianceSettings,
                        optOutMessage: e.target.value,
                      })
                    }
                  />
                </Grid>
              </Grid>
              <Box sx={{ mt: 3 }}>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleSaveComplianceSettings}
                  disabled={saving}
                >
                  {saving ? (
                    <CircularProgress size={20} />
                  ) : (
                    "Save Compliance Settings"
                  )}
                </Button>
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default Settings;
