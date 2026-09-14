import React, { useMemo, useState } from 'react';
import {
    Box,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    MenuItem,
    Chip,
    Collapse,
    IconButton,
    ToggleButtonGroup,
    ToggleButton,
    Typography,
    InputAdornment,
    useTheme
} from '@mui/material';
import { Search, SwapHoriz, TrendingDown, HistoryToggleOff, Block, ExpandMore } from '@mui/icons-material';
import { Slot } from '../../assets/ItemAux';
import CleaningIcon from './CleaningIcon';

const SLOT_NAMES = Object.getOwnPropertyNames(Slot).map((key) => Slot[key][0]);

const STATUS_FILTERS = [
    { value: 'all', label: 'All' },
    { value: 'unused', label: 'Unused' },
    { value: 'replaceable', label: 'Replaceable' }
];

const ReasonChip = ({ label, color, icon, hint }) => (
    <Chip size="small" variant="outlined" color={color} icon={icon} label={label} title={hint} />
);

const FLAT_STATS = ['Power', 'Toughness'];

const statValue = (source, stat) => {
    if (!source) return null;
    const value = source[stat];
    return typeof value === 'number' && !Number.isNaN(value) ? value : null;
};

const formatStat = (stat, value) => {
    if (value === null) return '—';
    const formatted = value.toLocaleString(undefined, { maximumFractionDigits: 2 });
    return FLAT_STATS.includes(stat) ? formatted : `${formatted}%`;
};

const StatColumnHeader = ({ item }) => (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1, minWidth: 0 }}>
        <CleaningIcon item={item} size={22} plain />
        <Typography
            variant="body2"
            noWrap
            title={item.name}
            sx={{ fontWeight: 700, maxWidth: 170 }}
        >
            {item.name}
        </Typography>
    </Box>
);

const StatBreakdown = ({ item, replacement }) => {
    const theme = useTheme();

    const names = new Set(item.statnames || []);
    if (replacement) {
        (replacement.statnames || []).forEach((stat) => names.add(stat));
    }

    const stats = Array.from(names).sort((a, b) => {
        const av = statValue(item, a) ?? statValue(replacement, a) ?? -Infinity;
        const bv = statValue(item, b) ?? statValue(replacement, b) ?? -Infinity;
        return bv - av;
    });

    const shared = replacement
        ? stats.filter((stat) => statValue(item, stat) !== null && statValue(replacement, stat) !== null)
        : [];
    const higher = shared.filter((stat) => statValue(replacement, stat) > statValue(item, stat)).length;
    const onlyOwn = replacement
        ? stats.filter((stat) => statValue(item, stat) !== null && statValue(replacement, stat) === null).length
        : 0;

    return (
        <Box sx={{ bgcolor: 'action.hover', borderRadius: 2, p: 2 }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                {replacement
                    ? `${replacement.name} is higher on ${higher} of ${shared.length} shared stats`
                    : `Stats on this item, strongest first`}
                {onlyOwn > 0 && ` · this item has ${onlyOwn} stat${onlyOwn === 1 ? '' : 's'} the replacement does not`}
            </Typography>

            <Table size="small" aria-label={replacement ? `Stat comparison with ${replacement.name}` : `Stats for ${item.name}`}>
                <TableHead>
                    <TableRow>
                        <TableCell>Stat</TableCell>
                        <TableCell align="right"><StatColumnHeader item={item} /></TableCell>
                        {replacement && <TableCell align="right"><StatColumnHeader item={replacement} /></TableCell>}
                    </TableRow>
                </TableHead>
                <TableBody>
                    {stats.map((stat) => {
                        const own = statValue(item, stat);
                        const other = replacement ? statValue(replacement, stat) : null;
                        const otherWins = replacement && other !== null && (own === null || other > own);
                        const ownWins = own !== null && (other === null || own > other);

                        return (
                            <TableRow key={stat}>
                                <TableCell>{stat}</TableCell>
                                <TableCell
                                    align="right"
                                    sx={{
                                        fontVariantNumeric: 'tabular-nums',
                                        fontWeight: ownWins ? 700 : 400,
                                        color: ownWins ? theme.palette.success.main : 'text.primary'
                                    }}
                                >
                                    {formatStat(stat, own)}
                                </TableCell>
                                {replacement && (
                                    <TableCell
                                        align="right"
                                        sx={{
                                            fontVariantNumeric: 'tabular-nums',
                                            fontWeight: otherWins ? 700 : 400,
                                            color: otherWins ? theme.palette.success.main : 'text.primary'
                                        }}
                                    >
                                        {formatStat(stat, other)}
                                    </TableCell>
                                )}
                            </TableRow>
                        );
                    })}
                    {stats.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={replacement ? 3 : 2}>
                                <Typography variant="body2" color="text.secondary">
                                    This item has no stats.
                                </Typography>
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </Box>
    );
};

const CleaningTable = ({ report, itemdata }) => {
    const [status, setStatus] = useState('all');
    const [slot, setSlot] = useState('all');
    const [query, setQuery] = useState('');
    const [expanded, setExpanded] = useState(() => new Set());

    const rows = useMemo(() => {
        const collect = (entries, rowStatus) => entries.map((entry) => ({
            ...entry,
            status: rowStatus,
            name: itemdata[entry.id] ? itemdata[entry.id].name : `Item #${entry.id}`
        }));

        return [
            ...collect(report.replaceable, 'replaceable'),
            ...collect(report.unused, 'unused')
        ];
    }, [report, itemdata]);

    const visible = useMemo(() => {
        const needle = query.trim().toLowerCase();
        return rows
            .filter((row) => status === 'all' || row.status === status)
            .filter((row) => slot === 'all' || row.slot === slot)
            .filter((row) => needle === '' || row.name.toLowerCase().includes(needle))
            .sort((a, b) => {
                const slotDelta = SLOT_NAMES.indexOf(a.slot) - SLOT_NAMES.indexOf(b.slot);
                if (slotDelta !== 0) return slotDelta;
                return a.name.localeCompare(b.name);
            });
    }, [rows, status, slot, query]);

    const handleStatus = (event, value) => {
        if (value !== null) setStatus(value);
    };

    const toggleExpanded = (key) => {
        setExpanded((prev) => {
            const next = new Set(prev);
            if (next.has(key)) {
                next.delete(key);
            } else {
                next.add(key);
            }
            return next;
        });
    };

    return (
        <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
            <Box sx={{ p: 2, display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
                <ToggleButtonGroup value={status} exclusive onChange={handleStatus} size="small" aria-label="Filter by status">
                    {STATUS_FILTERS.map((option) => (
                        <ToggleButton key={option.value} value={option.value} sx={{ textTransform: 'none', px: 2, fontWeight: 600 }}>
                            {option.label}
                        </ToggleButton>
                    ))}
                </ToggleButtonGroup>

                <TextField
                    select
                    size="small"
                    label="Slot"
                    value={slot}
                    onChange={(event) => setSlot(event.target.value)}
                    sx={{ minWidth: 160 }}
                >
                    <MenuItem value="all">All slots</MenuItem>
                    {SLOT_NAMES.map((name) => (
                        <MenuItem key={name} value={name}>{name}</MenuItem>
                    ))}
                </TextField>

                <TextField
                    size="small"
                    placeholder="Search by name"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    sx={{ flex: '1 1 200px', maxWidth: 320 }}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <Search fontSize="small" />
                            </InputAdornment>
                        )
                    }}
                />

                <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto', fontVariantNumeric: 'tabular-nums' }}>
                    {visible.length.toLocaleString()} {visible.length === 1 ? 'item' : 'items'}
                </Typography>
            </Box>

            <TableContainer sx={{ maxHeight: '60vh' }}>
                <Table stickyHeader size="small" aria-label="Discardable items">
                    <TableHead>
                        <TableRow>
                            <TableCell>Item</TableCell>
                            <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Slot</TableCell>
                            <TableCell align="right">Level</TableCell>
                            <TableCell align="right" sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Zone</TableCell>
                            <TableCell>Reason</TableCell>
                            <TableCell padding="none" align="right" />
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {visible.map((row) => {
                            const item = itemdata[row.id];
                            const dominatedName = row.dominatedBy != null && itemdata[row.dominatedBy]
                                ? itemdata[row.dominatedBy].name
                                : null;
                            const replacementName = row.bestOwnedId != null && itemdata[row.bestOwnedId]
                                ? itemdata[row.bestOwnedId].name
                                : null;

                            const rowKey = `${row.status}-${row.id}`;
                            const replacementId = row.status === 'replaceable' ? row.bestOwnedId : row.dominatedBy;
                            const replacement = replacementId != null ? itemdata[replacementId] : null;
                            const isOpen = expanded.has(rowKey);

                            return (
                                <React.Fragment key={rowKey}>
                                    <TableRow hover>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
                                                <CleaningIcon item={item} size={30} />
                                                <Box sx={{ minWidth: 0 }}>
                                                    <Typography variant="body2" noWrap sx={{ fontWeight: 600 }}>
                                                        {row.name}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.disabled">
                                                        #{row.id}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </TableCell>
                                        <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' }, textTransform: 'capitalize' }}>
                                            {row.slot}
                                        </TableCell>
                                        <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                                            {row.level}
                                        </TableCell>
                                        <TableCell align="right" sx={{ display: { xs: 'none', sm: 'table-cell' }, fontVariantNumeric: 'tabular-nums' }}>
                                            {row.zone ?? '-'}
                                        </TableCell>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                {row.status === 'replaceable' ? (
                                                    <ReasonChip
                                                        label="Replaceable"
                                                        color="secondary"
                                                        icon={<SwapHoriz fontSize="small" />}
                                                        hint={replacementName ? `Could be swapped for ${replacementName}` : 'A better owned item exists'}
                                                    />
                                                ) : row.dominatedBy != null ? (
                                                    <ReasonChip
                                                        label="Dominated"
                                                        color="warning"
                                                        icon={<TrendingDown fontSize="small" />}
                                                        hint={dominatedName ? `Strictly worse than ${dominatedName}` : 'Strictly worse than another owned item'}
                                                    />
                                                ) : (
                                                    <ReasonChip
                                                        label="Never optimal"
                                                        color="default"
                                                        icon={<HistoryToggleOff fontSize="small" />}
                                                        hint="Not on the Pareto frontier of any priority"
                                                    />
                                                )}
                                                {row.outdatedZone && (
                                                    <ReasonChip
                                                        label="Old zone"
                                                        color="default"
                                                        hint="From a zone you have already progressed past"
                                                    />
                                                )}
                                                {row.disabled && (
                                                    <ReasonChip
                                                        label="Disabled"
                                                        color="default"
                                                        icon={<Block fontSize="small" />}
                                                        hint="Already disabled in the optimizer"
                                                    />
                                                )}
                                            </Box>
                                        </TableCell>
                                        <TableCell padding="none" align="right">
                                            <IconButton
                                                size="small"
                                                onClick={() => toggleExpanded(rowKey)}
                                                aria-expanded={isOpen}
                                                aria-label={`${isOpen ? 'Hide' : 'Show'} stat breakdown for ${row.name}`}
                                                title={isOpen ? 'Hide stats' : 'Show stats'}
                                            >
                                                <ExpandMore
                                                    fontSize="small"
                                                    sx={{
                                                        transform: isOpen ? 'rotate(180deg)' : 'none',
                                                        transition: 'transform 0.2s'
                                                    }}
                                                />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell colSpan={6} sx={{ py: 0, borderBottom: isOpen ? undefined : 'none' }}>
                                            <Collapse in={isOpen} timeout="auto" unmountOnExit>
                                                <Box sx={{ py: 1.5 }}>
                                                    <StatBreakdown item={item} replacement={replacement} />
                                                </Box>
                                            </Collapse>
                                        </TableCell>
                                    </TableRow>
                                </React.Fragment>
                            );
                        })}
                        {visible.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                                    <Typography variant="body2" color="text.secondary">
                                        No items match the current filters.
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </Paper>
    );
};

export default CleaningTable;
