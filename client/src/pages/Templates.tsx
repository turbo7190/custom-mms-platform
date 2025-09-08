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
  Tabs,
  Tab,
} from "@mui/material";
import {
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ContentCopy as CopyIcon,
  Preview as PreviewIcon,
} from "@mui/icons-material";
import axios from "axios";

interface Template {
  _id: string;
  name: string;
  description?: string;
  category: string;
  content: {
    text: string;
    variables: Array<{
      name: string;
      description?: string;
      required: boolean;
      defaultValue?: string;
    }>;
  };
  usage: {
    totalSent: number;
    lastUsed?: string;
    successRate: number;
  };
  isActive: boolean;
  isApproved: boolean;
  createdAt: string;
}

const Templates: React.FC = () => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(
    null
  );
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [tabValue, setTabValue] = useState(0);
  const [templateForm, setTemplateForm] = useState({
    name: "",
    description: "",
    category: "promotional",
    text: "",
    variables: [] as Array<{
      name: string;
      description: string;
      required: boolean;
      defaultValue: string;
    }>,
  });
  const [previewVariables, setPreviewVariables] = useState<{
    [key: string]: string;
  }>({});

  const categories = [
    { value: "promotional", label: "Promotional" },
    { value: "informational", label: "Informational" },
    { value: "compliance", label: "Compliance" },
    { value: "transactional", label: "Transactional" },
    { value: "marketing", label: "Marketing" },
  ];

  useEffect(() => {
    fetchTemplates();
  }, [tabValue]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const isActive = tabValue === 0 ? "true" : "false";
      const response = await axios.get(`/api/templates?isActive=${isActive}`);
      setTemplates(response.data.templates);
    } catch (error: any) {
      setError(error.response?.data?.message || "Failed to fetch templates");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTemplate = async () => {
    try {
      await axios.post("/api/templates", templateForm);
      setDialogOpen(false);
      setTemplateForm({
        name: "",
        description: "",
        category: "promotional",
        text: "",
        variables: [],
      });
      fetchTemplates();
    } catch (error: any) {
      setError(error.response?.data?.message || "Failed to create template");
    }
  };

  const handleUpdateTemplate = async () => {
    if (!selectedTemplate) return;

    try {
      await axios.put(`/api/templates/${selectedTemplate._id}`, templateForm);
      setDialogOpen(false);
      setSelectedTemplate(null);
      fetchTemplates();
    } catch (error: any) {
      setError(error.response?.data?.message || "Failed to update template");
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    try {
      await axios.delete(`/api/templates/${templateId}`);
      fetchTemplates();
    } catch (error: any) {
      setError(error.response?.data?.message || "Failed to delete template");
    }
  };

  const handleDuplicateTemplate = async (templateId: string) => {
    try {
      await axios.post(`/api/templates/${templateId}/duplicate`);
      fetchTemplates();
    } catch (error: any) {
      setError(error.response?.data?.message || "Failed to duplicate template");
    }
  };

  const handlePreviewTemplate = async (template: Template) => {
    setSelectedTemplate(template);
    setPreviewVariables({});
    setPreviewDialogOpen(true);
  };

  const handleEditTemplate = (template: Template) => {
    setSelectedTemplate(template);
    setTemplateForm({
      name: template.name,
      description: template.description || "",
      category: template.category,
      text: template.content.text,
      variables: template.content.variables,
    });
    setDialogOpen(true);
  };

  const addVariable = () => {
    setTemplateForm({
      ...templateForm,
      variables: [
        ...templateForm.variables,
        { name: "", description: "", required: false, defaultValue: "" },
      ],
    });
  };

  const removeVariable = (index: number) => {
    setTemplateForm({
      ...templateForm,
      variables: templateForm.variables.filter((_, i) => i !== index),
    });
  };

  const updateVariable = (index: number, field: string, value: any) => {
    const updatedVariables = [...templateForm.variables];
    updatedVariables[index] = { ...updatedVariables[index], [field]: value };
    setTemplateForm({ ...templateForm, variables: updatedVariables });
  };

  const renderPreview = () => {
    if (!selectedTemplate) return "";

    let renderedText = selectedTemplate.content.text;
    selectedTemplate.content.variables.forEach((variable) => {
      const value =
        previewVariables[variable.name] ||
        variable.defaultValue ||
        `{{${variable.name}}}`;
      const regex = new RegExp(`{{${variable.name}}}`, "g");
      renderedText = renderedText.replace(regex, value);
    });

    return renderedText;
  };

  const handleMenuOpen = (
    event: React.MouseEvent<HTMLElement>,
    template: Template
  ) => {
    setAnchorEl(event.currentTarget);
    setSelectedTemplate(template);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedTemplate(null);
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
          Message Templates
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setSelectedTemplate(null);
            setTemplateForm({
              name: "",
              description: "",
              category: "promotional",
              text: "",
              variables: [],
            });
            setDialogOpen(true);
          }}
        >
          Create Template
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Card>
        <CardContent>
          <Tabs
            value={tabValue}
            onChange={(e, newValue) => setTabValue(newValue)}
            sx={{ mb: 2 }}
          >
            <Tab label="Active Templates" />
            <Tab label="Inactive Templates" />
          </Tabs>

          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Usage</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {templates.map((template) => (
                  <TableRow key={template._id}>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight="bold">
                          {template.name}
                        </Typography>
                        {template.description && (
                          <Typography variant="caption" color="text.secondary">
                            {template.description}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={template.category}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {template.usage.totalSent} sent
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {template.usage.successRate}% success rate
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={template.isActive ? "Active" : "Inactive"}
                        color={template.isActive ? "success" : "default"}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(template.createdAt).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <IconButton
                        onClick={(e) => handleMenuOpen(e, template)}
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

      {/* Create/Edit Template Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedTemplate ? "Edit Template" : "Create Template"}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Template Name"
                value={templateForm.name}
                onChange={(e) =>
                  setTemplateForm({ ...templateForm, name: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={templateForm.category}
                  onChange={(e) =>
                    setTemplateForm({
                      ...templateForm,
                      category: e.target.value,
                    })
                  }
                  label="Category"
                >
                  {categories.map((category) => (
                    <MenuItem key={category.value} value={category.value}>
                      {category.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description (Optional)"
                value={templateForm.description}
                onChange={(e) =>
                  setTemplateForm({
                    ...templateForm,
                    description: e.target.value,
                  })
                }
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={6}
                label="Message Text"
                value={templateForm.text}
                onChange={(e) =>
                  setTemplateForm({ ...templateForm, text: e.target.value })
                }
                placeholder="Enter your template text here. Use {{variableName}} for variables."
                helperText={`${templateForm.text.length}/1600 characters`}
              />
            </Grid>
            <Grid item xs={12}>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                sx={{ mb: 1 }}
              >
                <Typography variant="h6">Variables</Typography>
                <Button onClick={addVariable} size="small">
                  Add Variable
                </Button>
              </Box>
              {templateForm.variables.map((variable, index) => (
                <Grid container spacing={2} key={index} sx={{ mb: 2 }}>
                  <Grid item xs={12} sm={3}>
                    <TextField
                      fullWidth
                      label="Variable Name"
                      value={variable.name}
                      onChange={(e) =>
                        updateVariable(index, "name", e.target.value)
                      }
                      placeholder="e.g., customerName"
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      label="Description"
                      value={variable.description}
                      onChange={(e) =>
                        updateVariable(index, "description", e.target.value)
                      }
                    />
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <TextField
                      fullWidth
                      label="Default Value"
                      value={variable.defaultValue}
                      onChange={(e) =>
                        updateVariable(index, "defaultValue", e.target.value)
                      }
                    />
                  </Grid>
                  <Grid item xs={12} sm={2}>
                    <Button
                      onClick={() => removeVariable(index)}
                      color="error"
                      size="small"
                    >
                      Remove
                    </Button>
                  </Grid>
                </Grid>
              ))}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={
              selectedTemplate ? handleUpdateTemplate : handleCreateTemplate
            }
            variant="contained"
          >
            {selectedTemplate ? "Update" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog
        open={previewDialogOpen}
        onClose={() => setPreviewDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Preview Template</DialogTitle>
        <DialogContent>
          {selectedTemplate && (
            <Box>
              <Typography variant="h6" gutterBottom>
                {selectedTemplate.name}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {selectedTemplate.description}
              </Typography>

              {selectedTemplate.content.variables.length > 0 && (
                <Box sx={{ mt: 2, mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Variable Values:
                  </Typography>
                  {selectedTemplate.content.variables.map((variable) => (
                    <TextField
                      key={variable.name}
                      fullWidth
                      label={variable.name}
                      value={previewVariables[variable.name] || ""}
                      onChange={(e) =>
                        setPreviewVariables({
                          ...previewVariables,
                          [variable.name]: e.target.value,
                        })
                      }
                      sx={{ mb: 1 }}
                      size="small"
                    />
                  ))}
                </Box>
              )}

              <Box sx={{ mt: 2, p: 2, bgcolor: "grey.100", borderRadius: 1 }}>
                <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                  {renderPreview()}
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Template Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem
          onClick={() => {
            handleEditTemplate(selectedTemplate!);
            handleMenuClose();
          }}
        >
          <EditIcon sx={{ mr: 1 }} />
          Edit
        </MenuItem>
        <MenuItem
          onClick={() => {
            handlePreviewTemplate(selectedTemplate!);
            handleMenuClose();
          }}
        >
          <PreviewIcon sx={{ mr: 1 }} />
          Preview
        </MenuItem>
        <MenuItem
          onClick={() => {
            handleDuplicateTemplate(selectedTemplate!._id);
            handleMenuClose();
          }}
        >
          <CopyIcon sx={{ mr: 1 }} />
          Duplicate
        </MenuItem>
        <MenuItem
          onClick={() => {
            handleDeleteTemplate(selectedTemplate!._id);
            handleMenuClose();
          }}
        >
          <DeleteIcon sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default Templates;
