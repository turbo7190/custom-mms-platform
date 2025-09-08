import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Menu,
  MenuItem,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  FormControlLabel,
  Switch,
} from "@mui/material";
import {
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  Refresh as RefreshIcon,
  Send as SendIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Pending as PendingIcon,
} from "@mui/icons-material";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import axios from "axios";

interface Message {
  _id: string;
  recipient: {
    phoneNumber: string;
    name?: string;
    ageVerified: boolean;
    consentGiven: boolean;
  };
  content: {
    text: string;
    media?: Array<{
      type: string;
      url: string;
      filename: string;
    }>;
  };
  delivery: {
    status: string;
    sentAt?: string;
    deliveredAt?: string;
    failureReason?: string;
  };
  createdAt: string;
}

const Messages: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [sendForm, setSendForm] = useState({
    phoneNumber: "",
    name: "",
    text: "",
    scheduledFor: null as Date | null,
    isScheduled: false,
  });

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/messages");
      setMessages(response.data.messages);
    } catch (error: any) {
      setError(error.response?.data?.message || "Failed to fetch messages");
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    try {
      const messageData = {
        recipient: {
          phoneNumber: sendForm.phoneNumber,
          name: sendForm.name,
          ageVerified: true, // In production, implement proper age verification
          consentGiven: true, // In production, implement proper consent verification
        },
        content: {
          text: sendForm.text,
        },
        scheduling: sendForm.isScheduled
          ? {
              scheduledFor: sendForm.scheduledFor,
              isScheduled: true,
            }
          : undefined,
      };

      await axios.post("/api/messages/send", messageData);
      setSendDialogOpen(false);
      setSendForm({
        phoneNumber: "",
        name: "",
        text: "",
        scheduledFor: null,
        isScheduled: false,
      });
      fetchMessages();
    } catch (error: any) {
      setError(error.response?.data?.message || "Failed to send message");
    }
  };

  const handleRetryMessage = async (messageId: string) => {
    try {
      await axios.post(`/api/messages/${messageId}/retry`);
      fetchMessages();
    } catch (error: any) {
      setError(error.response?.data?.message || "Failed to retry message");
    }
  };

  const handleCancelMessage = async (messageId: string) => {
    try {
      await axios.delete(`/api/messages/${messageId}`);
      fetchMessages();
    } catch (error: any) {
      setError(error.response?.data?.message || "Failed to cancel message");
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "delivered":
        return <CheckCircleIcon color="success" />;
      case "failed":
      case "undelivered":
        return <ErrorIcon color="error" />;
      case "pending":
        return <PendingIcon color="warning" />;
      default:
        return <PendingIcon color="action" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "success";
      case "failed":
      case "undelivered":
        return "error";
      case "pending":
        return "warning";
      default:
        return "default";
    }
  };

  const handleMenuOpen = (
    event: React.MouseEvent<HTMLElement>,
    message: Message
  ) => {
    setAnchorEl(event.currentTarget);
    setSelectedMessage(message);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedMessage(null);
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

  return (
    <Box>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 3 }}
      >
        <Typography variant="h4" component="h1">
          Messages
        </Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchMessages}
            sx={{ mr: 2 }}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setSendDialogOpen(true)}
          >
            Send Message
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Card>
        <CardContent>
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Recipient</TableCell>
                  <TableCell>Message</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Sent At</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {messages.map((message) => (
                  <TableRow key={message._id}>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight="bold">
                          {message.recipient.name || "Unknown"}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {message.recipient.phoneNumber}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                        {message.content.text}
                      </Typography>
                      {message.content.media &&
                        message.content.media.length > 0 && (
                          <Typography variant="caption" color="text.secondary">
                            +{message.content.media.length} media
                          </Typography>
                        )}
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        {getStatusIcon(message.delivery.status)}
                        <Chip
                          label={message.delivery.status}
                          color={getStatusColor(message.delivery.status) as any}
                          size="small"
                        />
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {message.delivery.sentAt
                          ? new Date(message.delivery.sentAt).toLocaleString()
                          : new Date(message.createdAt).toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <IconButton
                        onClick={(e) => handleMenuOpen(e, message)}
                        size="small"
                      >
                        <MoreVertIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Send Message Dialog */}
      <Dialog
        open={sendDialogOpen}
        onClose={() => setSendDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Send MMS Message</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Phone Number"
                value={sendForm.phoneNumber}
                onChange={(e) =>
                  setSendForm({ ...sendForm, phoneNumber: e.target.value })
                }
                placeholder="+1234567890"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Recipient Name (Optional)"
                value={sendForm.name}
                onChange={(e) =>
                  setSendForm({ ...sendForm, name: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Message Text"
                value={sendForm.text}
                onChange={(e) =>
                  setSendForm({ ...sendForm, text: e.target.value })
                }
                placeholder="Enter your message here..."
                helperText={`${sendForm.text.length}/1600 characters`}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={sendForm.isScheduled}
                    onChange={(e) =>
                      setSendForm({
                        ...sendForm,
                        isScheduled: e.target.checked,
                      })
                    }
                  />
                }
                label="Schedule Message"
              />
            </Grid>
            {sendForm.isScheduled && (
              <Grid item xs={12}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DateTimePicker
                    label="Schedule For"
                    value={sendForm.scheduledFor}
                    onChange={(date) =>
                      setSendForm({ ...sendForm, scheduledFor: date })
                    }
                    renderInput={(params) => (
                      <TextField {...params} fullWidth />
                    )}
                  />
                </LocalizationProvider>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSendDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleSendMessage}
            variant="contained"
            startIcon={sendForm.isScheduled ? <ScheduleIcon /> : <SendIcon />}
          >
            {sendForm.isScheduled ? "Schedule" : "Send"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Message Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        {selectedMessage?.delivery.status === "failed" && (
          <MenuItem
            onClick={() => {
              handleRetryMessage(selectedMessage._id);
              handleMenuClose();
            }}
          >
            Retry
          </MenuItem>
        )}
        {selectedMessage?.delivery.status === "pending" && (
          <MenuItem
            onClick={() => {
              handleCancelMessage(selectedMessage._id);
              handleMenuClose();
            }}
          >
            Cancel
          </MenuItem>
        )}
      </Menu>
    </Box>
  );
};

export default Messages;
