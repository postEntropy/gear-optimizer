import React, { useState } from 'react';
import {
    Box, Button, Dialog, DialogTitle, DialogContent,
    DialogActions, Typography, alpha, useTheme
} from '@mui/material';
import { CalendarMonth } from '@mui/icons-material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';

const CustomRangePicker = ({ range, onSelect }) => {
    const theme = useTheme();
    const [open, setOpen] = useState(false);

    // Internal state using dayjs objects for the picker
    const [tempStart, setTempStart] = useState(range?.start ? dayjs(range.start) : null);
    const [tempEnd, setTempEnd] = useState(range?.end ? dayjs(range.end) : null);

    const handleOpen = () => {
        setTempStart(range?.start ? dayjs(range.start) : null);
        setTempEnd(range?.end ? dayjs(range.end) : null);
        setOpen(true);
    };
    const handleClose = () => setOpen(false);

    const handleApply = () => {
        onSelect({
            start: tempStart ? tempStart.toDate() : null,
            end: tempEnd ? tempEnd.toDate() : null
        });
        handleClose();
    };

    const hasSelection = range?.start || range?.end;
    const label = hasSelection
        ? `${dayjs(range.start).format('DD/MM/YYYY')} - ${dayjs(range.end).format('DD/MM/YYYY')}`
        : 'Select Range';

    return (
        <>
            <Button
                variant="outlined"
                startIcon={<CalendarMonth />}
                onClick={handleOpen}
                sx={{
                    borderRadius: 3,
                    textTransform: 'none',
                    fontWeight: 700,
                    borderColor: alpha(theme.palette.primary.main, 0.3),
                    '&:hover': {
                        borderColor: theme.palette.primary.main,
                        bgcolor: alpha(theme.palette.primary.main, 0.05)
                    }
                }}
            >
                {label}
            </Button>

            <Dialog
                open={open}
                onClose={handleClose}
                PaperProps={{
                    sx: {
                        borderRadius: 4,
                        backgroundImage: 'none',
                        bgcolor: 'background.paper'
                    }
                }}
            >
                <DialogTitle sx={{ fontWeight: 800, pb: 1 }}>Custom Date Range</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        Select the start and end dates to filter your progression history.
                    </Typography>

                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <Box sx={{ display: 'flex', gap: 2, flexDirection: 'column', pt: 1 }}>
                            <DatePicker
                                label="Start Date"
                                value={tempStart}
                                onChange={(newValue) => setTempStart(newValue)}
                                slotProps={{
                                    textField: {
                                        fullWidth: true,
                                        variant: 'outlined'
                                    }
                                }}
                            />
                            <DatePicker
                                label="End Date"
                                value={tempEnd}
                                onChange={(newValue) => setTempEnd(newValue)}
                                slotProps={{
                                    textField: {
                                        fullWidth: true,
                                        variant: 'outlined'
                                    }
                                }}
                            />
                        </Box>
                    </LocalizationProvider>
                </DialogContent>
                <DialogActions sx={{ p: 3, pt: 1 }}>
                    <Button onClick={handleClose} sx={{ fontWeight: 700, borderRadius: 2 }}>Cancel</Button>
                    <Button
                        onClick={handleApply}
                        variant="contained"
                        sx={{
                            borderRadius: 2,
                            fontWeight: 700,
                            px: 3,
                            boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`
                        }}
                    >
                        Apply Filter
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default CustomRangePicker;
