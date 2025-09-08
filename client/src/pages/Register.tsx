import React, { useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import {
  Container,
  Paper,
  Box,
  TextField,
  Button,
  Typography,
  Link,
  Alert,
  CircularProgress,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import { useAuth } from "../contexts/AuthContext";

const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    businessName: "",
    businessType: "",
    licenseNumber: "",
    phone: "",
    address: {
      street: "",
      city: "",
      state: "",
      zipCode: "",
    },
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const { register, loading, error } = useAuth();
  const navigate = useNavigate();

  const businessTypes = [
    { value: "cannabis", label: "Cannabis Dispensary" },
    { value: "vape", label: "Vape Shop" },
    { value: "cbd", label: "CBD Store" },
    { value: "tobacco", label: "Tobacco Shop" },
    { value: "other", label: "Other" },
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name.startsWith("address.")) {
      const field = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        address: {
          ...prev.address,
          [field]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    }

    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (!formData.businessName.trim()) {
      newErrors.businessName = "Business name is required";
    }

    if (!formData.businessType) {
      newErrors.businessType = "Business type is required";
    }

    if (!formData.licenseNumber.trim()) {
      newErrors.licenseNumber = "License number is required";
    }

    if (!formData.phone) {
      newErrors.phone = "Phone number is required";
    } else if (!/^\+?[\d\s\-\(\)]+$/.test(formData.phone)) {
      newErrors.phone = "Invalid phone number format";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await register(formData);
      navigate("/dashboard");
    } catch (error) {
      // Error is handled by the auth context
    }
  };

  return (
    <Container component="main" maxWidth="md">
      <Box
        sx={{
          marginTop: 4,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Paper elevation={3} sx={{ padding: 4, width: "100%" }}>
          <Box sx={{ textAlign: "center", mb: 3 }}>
            <Typography
              component="h1"
              variant="h4"
              sx={{ color: "primary.main", fontWeight: "bold" }}
            >
              Cannabis MMS
            </Typography>
            <Typography variant="h5" component="h2" sx={{ mt: 1 }}>
              Create Account
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Register your cannabis or vape business for MMS services
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
            <Typography variant="h6" sx={{ mb: 2, color: "primary.main" }}>
              Personal Information
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  id="firstName"
                  label="First Name"
                  name="firstName"
                  autoComplete="given-name"
                  value={formData.firstName}
                  onChange={handleChange}
                  error={!!errors.firstName}
                  helperText={errors.firstName}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  id="lastName"
                  label="Last Name"
                  name="lastName"
                  autoComplete="family-name"
                  value={formData.lastName}
                  onChange={handleChange}
                  error={!!errors.lastName}
                  helperText={errors.lastName}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  id="email"
                  label="Email Address"
                  name="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleChange}
                  error={!!errors.email}
                  helperText={errors.email}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  name="password"
                  label="Password"
                  type="password"
                  id="password"
                  autoComplete="new-password"
                  value={formData.password}
                  onChange={handleChange}
                  error={!!errors.password}
                  helperText={errors.password}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  name="confirmPassword"
                  label="Confirm Password"
                  type="password"
                  id="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  error={!!errors.confirmPassword}
                  helperText={errors.confirmPassword}
                />
              </Grid>
            </Grid>

            <Typography
              variant="h6"
              sx={{ mb: 2, mt: 3, color: "primary.main" }}
            >
              Business Information
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  id="businessName"
                  label="Business Name"
                  name="businessName"
                  value={formData.businessName}
                  onChange={handleChange}
                  error={!!errors.businessName}
                  helperText={errors.businessName}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required error={!!errors.businessType}>
                  <InputLabel id="businessType-label">Business Type</InputLabel>
                  <Select
                    labelId="businessType-label"
                    id="businessType"
                    name="businessType"
                    value={formData.businessType}
                    label="Business Type"
                    onChange={handleChange}
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
                  required
                  fullWidth
                  id="licenseNumber"
                  label="Business License Number"
                  name="licenseNumber"
                  value={formData.licenseNumber}
                  onChange={handleChange}
                  error={!!errors.licenseNumber}
                  helperText={errors.licenseNumber}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  id="phone"
                  label="Business Phone"
                  name="phone"
                  autoComplete="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  error={!!errors.phone}
                  helperText={errors.phone}
                />
              </Grid>
            </Grid>

            <Typography
              variant="h6"
              sx={{ mb: 2, mt: 3, color: "primary.main" }}
            >
              Business Address
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  id="address.street"
                  label="Street Address"
                  name="address.street"
                  autoComplete="street-address"
                  value={formData.address.street}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  id="address.city"
                  label="City"
                  name="address.city"
                  autoComplete="address-level2"
                  value={formData.address.city}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  id="address.state"
                  label="State"
                  name="address.state"
                  autoComplete="address-level1"
                  value={formData.address.state}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  id="address.zipCode"
                  label="ZIP Code"
                  name="address.zipCode"
                  autoComplete="postal-code"
                  value={formData.address.zipCode}
                  onChange={handleChange}
                />
              </Grid>
            </Grid>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2, py: 1.5 }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : "Create Account"}
            </Button>
            <Box sx={{ textAlign: "center" }}>
              <Link component={RouterLink} to="/login" variant="body2">
                Already have an account? Sign In
              </Link>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Register;
