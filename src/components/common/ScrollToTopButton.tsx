import { styled } from "@mui/material/styles";
import { Box, Button, Tooltip, Zoom } from "@mui/material";
import { KeyboardArrowUp } from "@mui/icons-material";
import { useEffect, useState } from "react";
import { useResponsive } from "../../hooks/useResponsive";

const FloatingButton = styled(Box)(({ theme }) => ({
    position: 'fixed',
    left: '50%',
    bottom: theme.spacing(4),
    transform: 'translateX(-50%)',
    zIndex: 1000,
}));

interface ScrollToTopButtonProps {
    targetId?: string; // Allow targeting specific scrollable containers
}

function ScrollToTopButton({ targetId }: ScrollToTopButtonProps) {
    const [showScrollTop, setShowScrollTop] = useState(false);
    const { isMobile } = useResponsive();

    useEffect(() => {
        // Resolve the target to either the specific container or the window
        const targetElement = targetId ? document.getElementById(targetId) : window;
        if (!targetElement) return;

        const handleScroll = (e: Event) => {
            const target = e.target as HTMLElement | Document;
            
            // Handle differences between Document/Window and standard HTML elements
            const scrollTop = target instanceof Document 
                ? window.scrollY 
                : (target as HTMLElement).scrollTop;
                
            const viewportHeight = target instanceof Document 
                ? window.innerHeight 
                : (target as HTMLElement).clientHeight;

            const scrollTrigger = viewportHeight * 0.3; // Show after 30%
            setShowScrollTop(scrollTop > scrollTrigger);
        };

        targetElement.addEventListener('scroll', handleScroll);
        return () => targetElement.removeEventListener('scroll', handleScroll);
    }, [targetId]);

    const scrollToTop = () => {
        const targetElement = targetId ? document.getElementById(targetId) : window;
        if (targetElement) {
            targetElement.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        }
    };

    return (
        <Zoom in={showScrollTop}>
            <FloatingButton sx={{ bottom: isMobile ? 70 : 24 }}>
                <Tooltip title="Scroll to top" placement="top">
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