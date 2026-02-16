import React, { useMemo } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, Box, Typography, Grid, Chip, Divider
} from '@mui/material';
import { SourceItem } from '../Item/Item';

const UselessItemsDialog = ({
    open,
    onClose,
    usefulItemIds,
    itemdata,
    items,
    handleDisableItem,
    handleMassDisable
}) => {
    const uselessItems = useMemo(() => {
        if (!usefulItemIds) return [];
        const usefulSet = new Set(usefulItemIds);
        return items.filter(id => {
            const item = itemdata[id];
            return item && !item.empty && !usefulSet.has(id);
        });
    }, [usefulItemIds, itemdata, items]);

    const handleDisableAll = () => {
        const toDisable = uselessItems.filter(id => !itemdata[id].disable);
        handleMassDisable(toDisable);
        onClose();
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>
                <Typography variant="h6" component="span" sx={{ fontWeight: 'bold' }}>
                    Useless Items Scanner
                </Typography>
                <Typography variant="caption" sx={{ ml: 2, color: 'text.secondary' }}>
                    {uselessItems.length} items found
                </Typography>
            </DialogTitle>
            <DialogContent dividers>
                <Typography variant="body2" sx={{ mb: 2 }}>
                    These items are not part of any Pareto frontier for your active priorities,
                    nor are they currently equipped or saved in any loadout.
                </Typography>
                {uselessItems.length === 0 ? (
                    <Box sx={{ p: 4, textAlign: 'center' }}>
                        <Typography color="text.secondary">No useless items found! Your inventory is lean.</Typography>
                    </Box>
                ) : (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {uselessItems.map(id => (
                            <SourceItem
                                key={id}
                                item={itemdata[id]}
                                handleClickItem={() => handleDisableItem(id)}
                            />
                        ))}
                    </Box>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Close</Button>
                {uselessItems.length > 0 && (
                    <Button
                        onClick={handleDisableAll}
                        variant="contained"
                        color="warning"
                    >
                        Disable All Non-Optimal
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
};

export default UselessItemsDialog;
