import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Divider
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useSnackbar } from 'notistack';
import { ImportTemplate, CreateImportTemplateDTO, UpdateImportTemplateDTO } from '../../models/ImportTemplate';
import { getImportTemplates, createImportTemplate, updateImportTemplate, deleteImportTemplate } from '../../services/importTemplateService';

interface TemplateDialogProps {
  open: boolean;
  onClose: () => void;
  template: Partial<ImportTemplate> | null;
  onSave: (template: Partial<ImportTemplate>) => void;
}

function TemplateDialog({ open, onClose, template, onSave }: TemplateDialogProps) {
  const [formData, setFormData] = useState<Partial<ImportTemplate>>(template || {
    name: '',
    amountKey: '',
    transactionDateKey: '',
    descriptionKey: '',
    fileType: 'CSV'
  });

  useEffect(() => {
    setFormData(template || {
      name: '',
      amountKey: '',
      transactionDateKey: '',
      descriptionKey: '',
      fileType: 'CSV'
    });
  }, [template]);

  const handleSave = () => {
    onSave(formData);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {template?.id ? 'Edit Template' : 'Create Template'}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Template Name"
            value={formData.name || ''}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            fullWidth
            required
          />
          <TextField
            select
            label="File Type"
            value={formData.fileType || 'CSV'}
            onChange={(e) => setFormData({ ...formData, fileType: e.target.value as 'CSV' | 'JSON' })}
            fullWidth
            required
          >
            <MenuItem value="CSV">CSV</MenuItem>
            <MenuItem value="JSON">JSON</MenuItem>
          </TextField>
          <TextField
            label="Amount Key"
            value={formData.amountKey || ''}
            onChange={(e) => setFormData({ ...formData, amountKey: e.target.value })}
            fullWidth
            required
            helperText="The column/field name that contains the transaction amount"
          />
          <TextField
            label="Transaction Date Key"
            value={formData.transactionDateKey || ''}
            onChange={(e) => setFormData({ ...formData, transactionDateKey: e.target.value })}
            fullWidth
            required
            helperText="The column/field name that contains the transaction date"
          />
          <TextField
            label="Description Key"
            value={formData.descriptionKey || ''}
            onChange={(e) => setFormData({ ...formData, descriptionKey: e.target.value })}
            fullWidth
            required
            helperText="The column/field name that contains the transaction description"
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={!formData.name || !formData.amountKey || !formData.transactionDateKey || !formData.descriptionKey}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default function ImportTemplateManager() {
  const { user } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const [templates, setTemplates] = useState<ImportTemplate[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ImportTemplate | null>(null);

  useEffect(() => {
    loadTemplates();
  }, [user?.uid]);

  const loadTemplates = async () => {
    if (!user?.uid) return;

    try {
      const data = await getImportTemplates(user.uid);
      setTemplates(data);
    } catch (error) {
      console.error('Error loading templates:', error);
      enqueueSnackbar('Error loading templates', { variant: 'error' });
    }
  };

  const handleSave = async (templateData: Partial<ImportTemplate>) => {
    if (!user?.uid) return;

    try {
      if (templateData.id) {
        // Update existing template
        const updateData: UpdateImportTemplateDTO = {
          name: templateData.name,
          amountKey: templateData.amountKey,
          transactionDateKey: templateData.transactionDateKey,
          descriptionKey: templateData.descriptionKey,
          fileType: templateData.fileType
        };
        await updateImportTemplate(templateData.id, updateData);
        enqueueSnackbar('Template updated successfully', { variant: 'success' });
      } else {
        // Create new template
        const createData: CreateImportTemplateDTO = {
          name: templateData.name!,
          amountKey: templateData.amountKey!,
          transactionDateKey: templateData.transactionDateKey!,
          descriptionKey: templateData.descriptionKey!,
          fileType: templateData.fileType!,
          userId: user.uid
        };
        await createImportTemplate(createData);
        enqueueSnackbar('Template created successfully', { variant: 'success' });
      }

      loadTemplates();
      setSelectedTemplate(null);
    } catch (error) {
      console.error('Error saving template:', error);
      enqueueSnackbar('Error saving template', { variant: 'error' });
    }
  };

  const handleDelete = async (template: ImportTemplate) => {
    try {
      await deleteImportTemplate(template.id);
      enqueueSnackbar('Template deleted successfully', { variant: 'success' });
      loadTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
      enqueueSnackbar('Error deleting template', { variant: 'error' });
    }
  };

  return (
    <Paper sx={{ p: 3, mt: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Import Transaction Templates</Typography>
        <Button
          startIcon={<AddIcon />}
          variant="contained"
          onClick={() => {
            setSelectedTemplate(null);
            setDialogOpen(true);
          }}
        >
          Add Template
        </Button>
      </Box>

      <Divider sx={{ mb: 2 }} />

      <List>
        {templates.map((template) => (
          <ListItem key={template.id} divider>
            <ListItemText
              primary={template.name}
              secondary={`File Type: ${template.fileType}`}
            />
            <ListItemSecondaryAction>
              <IconButton
                edge="end"
                aria-label="edit"
                onClick={() => {
                  setSelectedTemplate(template);
                  setDialogOpen(true);
                }}
                sx={{ mr: 1 }}
              >
                <EditIcon />
              </IconButton>
              <IconButton
                edge="end"
                aria-label="delete"
                onClick={() => handleDelete(template)}
              >
                <DeleteIcon />
              </IconButton>
            </ListItemSecondaryAction>
          </ListItem>
        ))}
        {templates.length === 0 && (
          <ListItem>
            <ListItemText
              primary="No templates found"
              secondary="Click the Add Template button to create your first template"
            />
          </ListItem>
        )}
      </List>

      <TemplateDialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setSelectedTemplate(null);
        }}
        template={selectedTemplate}
        onSave={handleSave}
      />
    </Paper>
  );
} 