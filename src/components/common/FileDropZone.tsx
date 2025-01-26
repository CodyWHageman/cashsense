import React from 'react';
import { Box, Typography } from '@mui/material';
import { useDropzone } from 'react-dropzone';
import { CloudUpload } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';

interface FileDropZoneProps {
  onFileSelect: (file: File) => void;
  accept?: Record<string, string[]>;
  helperText?: string;
}

export function FileDropZone({ onFileSelect, accept, helperText }: FileDropZoneProps) {
  const theme = useTheme();
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      const file = acceptedFiles[0];
      if (file) {
        onFileSelect(file);
      }
    },
    accept,
    multiple: false,
  });

  return (
    <Box
      {...getRootProps()}
      sx={{
        border: `2px dashed ${theme.palette.divider}`,
        borderRadius: 1,
        p: 3,
        textAlign: 'center',
        cursor: 'pointer',
        bgcolor: isDragActive ? 'action.hover' : 'transparent',
        '&:hover': {
          bgcolor: 'action.hover'
        },
        transition: 'all 0.2s ease'
      }}
    >
      <input {...getInputProps()} />
      <CloudUpload sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
      <Typography>
        {isDragActive ? 'Drop the file here' : 'Drag & drop files here, or click to select'}
      </Typography>
      {helperText && (
        <Typography variant="caption" color="text.secondary">
          {helperText}
        </Typography>
      )}
    </Box>
  );
} 