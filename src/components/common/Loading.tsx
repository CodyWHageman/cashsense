import { CircularProgress } from "@mui/material";

import { Container } from "@mui/material";

import { Box } from "@mui/material";

function Loading() {
    return (
      <Container>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
          <CircularProgress />
        </Box>
      </Container>
    );
}

export default Loading;