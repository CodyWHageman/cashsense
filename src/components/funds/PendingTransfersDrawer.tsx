// src/components/funds/PendingTransfersDrawer.tsx
import { Box, Drawer, Typography, List, ListItem, ListItemText, IconButton, useTheme } from '@mui/material';
import { Close } from '@mui/icons-material';
import { useResponsive } from '../../hooks/useResponsive';
import { Fund } from '../../models/Budget';

interface PendingTransfersDrawerProps {
    open: boolean;
    onClose: () => void;
    funds: Fund[];
}

export function PendingTransfersDrawer({ open, onClose, funds }: PendingTransfersDrawerProps) {
    const { isMobile } = useResponsive();
    const theme = useTheme();

    // Flatten all funds into a single array of pending transactions, 
    // attaching the parent fund's name to each transaction for the UI.
    const pendingTransfers = funds.flatMap(fund => 
        (fund.fundTransactions || [])
            .filter(ft => !ft.transferComplete)
            .map(ft => ({
                ...ft,
                fundName: fund.name // Assuming your Fund model uses 'name'
            }))
    );

    return (
        <Drawer
            anchor={isMobile ? 'bottom' : 'right'}
            open={open}
            onClose={onClose}
            PaperProps={{
                sx: {
                    width: isMobile ? '100%' : 400,
                    height: isMobile ? '80vh' : '100vh',
                    borderTopLeftRadius: isMobile ? 16 : 0,
                    borderTopRightRadius: isMobile ? 16 : 0,
                    p: 2
                }
            }}
        >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Pending Transfers</Typography>
                <IconButton onClick={onClose} size="small">
                    <Close />
                </IconButton>
            </Box>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                These are fund withdrawals that require a physical transfer from your savings to your checking account.
            </Typography>

            <List sx={{ flex: 1, overflowY: 'auto' }}>
                {pendingTransfers.length === 0 ? (
                    <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 4 }}>
                        All caught up! No pending transfers.
                    </Typography>
                ) : (
                    pendingTransfers.map((transfer) => (
                        <ListItem 
                            key={transfer.id}
                            sx={{ 
                                border: `1px solid ${theme.palette.divider}`,
                                borderRadius: 1,
                                mb: 1,
                                flexDirection: 'column',
                                alignItems: 'flex-start'
                            }}
                        >
                            <Box sx={{ display: 'flex', width: '100%', justifyContent: 'space-between', mb: 1 }}>
                                <ListItemText 
                                    primary={transfer.fundName} // Display the fund name prominently
                                    secondary={
                                        <>
                                            <Typography variant="body2" component="span" display="block">
                                                {transfer.transaction?.description || 'Withdrawal'}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary" display="block">
                                                {transfer.transaction?.date?.toLocaleDateString()}
                                            </Typography>
                                        </>
                                    } 
                                />
                                <Typography variant="subtitle1" fontWeight="bold" color="error.main">
                                    ${transfer.transaction?.amount?.toFixed(2) || '0.00'}
                                </Typography>
                            </Box>
                        </ListItem>
                    ))
                )}
            </List>
        </Drawer>
    );
}