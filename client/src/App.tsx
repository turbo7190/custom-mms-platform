import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { AuthProvider } from "./contexts/AuthContext";
import { SocketProvider } from "./contexts/SocketContext";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Messages from "./pages/Messages";
import Templates from "./pages/Templates";
import Analytics from "./pages/Analytics";
import Compliance from "./pages/Compliance";
import Settings from "./pages/Settings";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#2e7d32", // Green for cannabis industry
      light: "#4caf50",
      dark: "#1b5e20",
    },
    secondary: {
      main: "#ff6f00", // Orange accent
      light: "#ff9800",
      dark: "#e65100",
    },
    background: {
      default: "#f5f5f5",
      paper: "#ffffff",
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          borderRadius: 8,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <SocketProvider>
          <Router>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="messages" element={<Messages />} />
                <Route path="templates" element={<Templates />} />
                <Route path="analytics" element={<Analytics />} />
                <Route path="compliance" element={<Compliance />} />
                <Route path="settings" element={<Settings />} />
              </Route>
            </Routes>
          </Router>
        </SocketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
