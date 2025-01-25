import React from 'react';
import { Box } from '@mui/material';

interface LoomVideoProps {
  videoId: string;
  sessionId?: string;
  aspectRatio?: '16:9' | '4:3' | '1:1';
  marginBottom?: number;
}

function LoomVideo({ 
  videoId, 
  sessionId, 
  aspectRatio = '16:9',
  marginBottom = 3 
}: LoomVideoProps) {
  // Calculate padding based on aspect ratio
  const getPaddingBottom = () => {
    switch (aspectRatio) {
      case '4:3':
        return '75%';
      case '1:1':
        return '100%';
      case '16:9':
      default:
        return '56.25%';
    }
  };

  const embedUrl = sessionId
    ? `https://www.loom.com/embed/${videoId}?sid=${sessionId}`
    : `https://www.loom.com/embed/${videoId}`;

  return (
    <Box 
      sx={{ 
        position: 'relative', 
        paddingBottom: getPaddingBottom(),
        height: 0,
        mb: marginBottom
      }}
    >
      <iframe 
        src={embedUrl}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          border: 0
        }}
        allowFullScreen
        title={`Loom video ${videoId}`}
      />
    </Box>
  );
} 

export default LoomVideo; 