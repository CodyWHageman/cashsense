import { styled } from "@mui/material/styles";

import { Box } from "@mui/material";

import { KeyboardArrowUp } from "@mui/icons-material";
import { Button, Tooltip } from "@mui/material";

import { Zoom } from "@mui/material";
import { useEffect, useState } from "react";
import { useResponsive } from "../../hooks/useResponsive";

const FloatingButton = styled(Box)(({ theme }) => ({
    position: 'fixed',
    left: '50%',
    bottom: theme.spacing(4),
    transform: 'translateX(-50%)',
    zIndex: 1000,
    // marginLeft: '100px' // Offset by half the sidebar width to center in main content
  }));

 function ScrollToTopButton() {
    const [showScrollTop, setShowScrollTop] = useState(false);
    const { isMobile } = useResponsive();

    useEffect(() => {
        const handleScroll = () => {
          const scrollTrigger = window.innerHeight * 0.3; // Show after 30% of viewport height
          setShowScrollTop(window.scrollY > scrollTrigger);
        };
    
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
      }, []);

    const scrollToTop = () => {
        window.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
      };

    return (
        <Zoom in={showScrollTop}>
            <FloatingButton sx={{
                bottom: isMobile ? 70 : 24
            }}>
                <Tooltip title="Scroll to top" placement="left">
                    <Button
                        onClick={scrollToTop}
                        variant="contained"
                        sx={{
                            borderRadius: '50%',
                            minWidth: '48px',
                            width: '48px',
                            height: '48px'
                        }}
                    >
                        <KeyboardArrowUp />
                    </Button>
                </Tooltip>
            </FloatingButton>
        </Zoom>
    )
}

export default ScrollToTopButton;