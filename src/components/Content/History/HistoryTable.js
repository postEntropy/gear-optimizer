import React, { useState, useMemo } from 'react';
import {
    Box,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    Paper,
    Checkbox,
    IconButton,
    Tooltip,
    useTheme,
    alpha,
    Typography,
    Chip
} from '@mui/material';
import { Delete, CompareArrows, FilterList } from '@mui/icons-material';
import { useHistoryContext } from './HistoryContext';
import { shorten, toTime } from "../../../util";

const EnhancedTableHead = ({ onSelectAllClick, order, orderBy, numSelected, rowCount, onRequestSort }) => {
    const createSortHandler = (property) => (event) => {
        onRequestSort(event, property);
    };

    const headCells = [
        { id: 'timestamp', label: 'Date', align: 'left' },
        { id: 'playtime', label: 'Rebirth Length', align: 'left' },
        { id: 'exp', label: 'Total XP', align: 'right' },
        { id: 'ap', label: 'AP', align: 'right' },
        { id: 'highestBoss', label: 'Highest Boss', align: 'center' },
    ];

    return (
        <TableHead>
            <TableRow>
                <TableCell padding="checkbox">
                    <Checkbox
                        color="primary"
                        indeterminate={numSelected > 0 && numSelected < rowCount}
                        checked={rowCount > 0 && numSelected === rowCount}
                        onChange={onSelectAllClick}
                        inputProps={{ 'aria-label': 'select all saves' }}
                    />
                </TableCell>
                {headCells.map((headCell) => (
                    <TableCell
                        key={headCell.id}
                        align={headCell.align}
                        sortDirection={orderBy === headCell.id ? order : false}
                        sx={{ fontWeight: 700 }}
                    >
                        {/* Simple click sort for now, can add TableSortLabel later */}
                        <Box
                            component="span"
                            onClick={createSortHandler(headCell.id)}
                            sx={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 0.5 }}
                        >
                            {headCell.label}
                            {orderBy === headCell.id ? (
                                <Box component="span" sx={{ fontSize: '0.8rem', opacity: 0.7 }}>
                                    {order === 'desc' ? '▼' : '▲'}
                                </Box>
                            ) : null}
                        </Box>
                    </TableCell>
                ))}
                <TableCell align="center">Actions</TableCell>
            </TableRow>
        </TableHead>
    );
};

const HistoryTable = ({ history }) => {
    const theme = useTheme();
    const {
        isCompareMode,
        setIsCompareMode,
        selectedSaves,
        toggleSaveSelection,
        clearSelection
    } = useHistoryContext();

    const [order, setOrder] = useState('desc');
    const [orderBy, setOrderBy] = useState('timestamp');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const handleRequestSort = (event, property) => {
        const isAsc = orderBy === property && order === 'asc';
        setOrder(isAsc ? 'desc' : 'asc');
        setOrderBy(property);
    };

    const handleSelectAllClick = (event) => {
        // Implementation for mass delete or compare selection (limit 2 usually)
        // For now, let's just ignore select all for compare mode or restrict it.
        // Or select all for 'Delete' action ?
    };

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    // Sorting Logic
    const sortedRows = useMemo(() => {
        if (!history) return [];
        return [...history].sort((a, b) => {
            let valA = a[orderBy] || 0;
            let valB = b[orderBy] || 0;

            // Special handling for Boss Level which is split across 3 fields
            if (orderBy === 'highestBoss') {
                // Calculate a normalized boss score
                const getScore = (entry) => (entry.highestSadisticBoss * 1000000) + (entry.highestHardBoss * 1000) + entry.highestBoss;
                valA = getScore(a);
                valB = getScore(b);
            }

            if (valB < valA) return order === 'desc' ? -1 : 1;
            if (valB > valA) return order === 'desc' ? 1 : -1;
            return 0;
        });
    }, [history, order, orderBy]);

    // Pagination Logic
    const visibleRows = useMemo(() => {
        return sortedRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
    }, [sortedRows, page, rowsPerPage]);


    return (
        <Paper sx={{
            width: '100%',
            mb: 2,
            borderRadius: 4,
            overflow: 'hidden',
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            bgcolor: alpha(theme.palette.background.paper, 0.6),
            backdropFilter: 'blur(10px)',
        }}>
            {/* Toolbar */}
            <Box sx={{
                p: 2,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`
            }}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    History Log
                </Typography>
                <Box>
                    <Tooltip title="Compare Mode">
                        <IconButton
                            color={isCompareMode ? 'primary' : 'default'}
                            onClick={() => setIsCompareMode(!isCompareMode)}
                        >
                            <CompareArrows />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Filter List">
                        <IconButton>
                            <FilterList />
                        </IconButton>
                    </Tooltip>
                </Box>
            </Box>

            <TableContainer>
                <Table sx={{ minWidth: 750 }} aria-labelledby="tableTitle" size="medium">
                    <EnhancedTableHead
                        numSelected={selectedSaves.length}
                        order={order}
                        orderBy={orderBy}
                        onSelectAllClick={handleSelectAllClick}
                        onRequestSort={handleRequestSort}
                        rowCount={history.length}
                    />
                    <TableBody>
                        {visibleRows.map((row, index) => {
                            const isSelected = selectedSaves.find(s => s.timestamp === row.timestamp);
                            const labelId = `enhanced-table-checkbox-${index}`;

                            return (
                                <TableRow
                                    hover
                                    onClick={() => toggleSaveSelection(row)}
                                    role="checkbox"
                                    aria-checked={isSelected}
                                    tabIndex={-1}
                                    key={row.timestamp}
                                    selected={!!isSelected}
                                    sx={{
                                        cursor: 'pointer',
                                        '&.Mui-selected': {
                                            bgcolor: alpha(theme.palette.primary.main, 0.08),
                                            '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.12) }
                                        }
                                    }}
                                >
                                    <TableCell padding="checkbox">
                                        <Checkbox
                                            color="primary"
                                            checked={!!isSelected}
                                            inputProps={{ 'aria-labelledby': labelId }}
                                        />
                                    </TableCell>
                                    <TableCell component="th" id={labelId} scope="row">
                                        <Box>
                                            <Typography variant="body2" fontWeight={600}>
                                                {new Date(row.timestamp).toLocaleDateString()}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {new Date(row.timestamp).toLocaleTimeString()}
                                            </Typography>
                                        </Box>
                                    </TableCell>
                                    <TableCell align="left">{toTime((row.playtime || 0) * 50)}</TableCell>
                                    <TableCell align="right">
                                        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 700 }}>
                                            {shorten(row.exp)}
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="right">
                                        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                                            {shorten(row.ap)}
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="center">
                                        {row.highestSadisticBoss > 1 ? (
                                            <Chip size="small" label={`S${row.highestSadisticBoss}`} color="error" variant="outlined" />
                                        ) : row.highestHardBoss > 1 ? (
                                            <Chip size="small" label={`E${row.highestHardBoss}`} color="warning" variant="outlined" />
                                        ) : (
                                            <Chip size="small" label={`N${row.highestBoss}`} color="default" variant="outlined" />
                                        )}
                                    </TableCell>
                                    <TableCell align="center">
                                        <IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); /* Handle Delete */ }}>
                                            <Delete fontSize="small" />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </TableContainer>
            <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                component="div"
                count={history.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
            />
        </Paper>
    );
};

export default HistoryTable;
