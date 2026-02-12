import React, { useMemo, useState } from 'react';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import Box from '@mui/material/Box';
import ListSubheader from '@mui/material/ListSubheader';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import Typography from '@mui/material/Typography';
import SearchIcon from '@mui/icons-material/Search';
import { Factors, FactorGroups } from '../../assets/ItemAux';
import { default as Crement } from '../Crement/Crement';

const FactorForm = (props) => {
    const { factors, idx, handleEditFactor, equip, maxslots, handleCrement } = props;
    const factorKey = factors[idx];
    const [searchTerm, setSearchTerm] = useState('');

    const handleChange = (event) => {
        // Only trigger edit if it's a real selection, not the search field
        if (event.target.value !== 'SEARCH_FIELD') {
            handleEditFactor(idx, event.target.value);
            setSearchTerm(''); // Reset search on selection
        }
    };

    // Filter groups and keys based on search term
    const filteredGroups = useMemo(() => {
        if (!searchTerm) return FactorGroups;

        const lowerSearch = searchTerm.toLowerCase();
        return FactorGroups.map(group => {
            const matchedKeys = group.keys.filter(key => {
                if (!Factors[key]) return false;
                const label = Factors[key][0].toLowerCase();
                return label.includes(lowerSearch);
            });

            if (matchedKeys.length === 0) return null;
            return { ...group, keys: matchedKeys };
        }).filter(Boolean);
    }, [searchTerm]);

    const accslots = equip.accessory.length;

    return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
            <Typography variant="caption" sx={{ fontWeight: 900, opacity: 0.3, width: '20px' }}>
                #{idx + 1}
            </Typography>
            <FormControl size="small" sx={{ flexGrow: 1, minWidth: 180 }}>
                <Select
                    value={factorKey}
                    onChange={handleChange}
                    displayEmpty
                    renderValue={(selected) => Factors[selected] ? Factors[selected][0] : 'Select Factor'}
                    MenuProps={{
                        autoFocus: false,
                        transitionDuration: 0,
                        anchorOrigin: {
                            vertical: 'bottom',
                            horizontal: 'center',
                        },
                        transformOrigin: {
                            vertical: 'top',
                            horizontal: 'center',
                        },
                        PaperProps: {
                            style: {
                                width: 800,
                                maxWidth: 'none',
                                maxHeight: 600,
                            },
                        },
                        MenuListProps: {
                            style: {
                                columnCount: 3,
                                columnGap: '20px',
                                padding: '10px',
                            },
                        },
                    }}
                >
                    {/* Search Field Item - Spans all columns */}
                    <Box
                        onKeyDown={(e) => e.stopPropagation()}
                        sx={{
                            p: 1,
                            position: 'sticky',
                            top: -8, // Adjust for MenuList padding
                            bgcolor: 'background.paper',
                            zIndex: 2,
                            borderBottom: '1px solid',
                            borderColor: 'divider',
                            columnSpan: 'all', // Ensure it spans across columns
                            mb: 1
                        }}
                    >
                        <TextField
                            fullWidth
                            size="small"
                            placeholder="Search factors..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key !== 'Escape') {
                                    e.stopPropagation();
                                }
                            }}
                            autoFocus
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon fontSize="small" />
                                    </InputAdornment>
                                ),
                            }}
                        />
                    </Box>

                    {/* Flat list of items - direct children of Select for logic */}
                    {filteredGroups.flatMap((group) => [
                        <ListSubheader
                            key={group.label}
                            disableSticky
                            sx={{
                                fontWeight: 'bold',
                                color: 'primary.main',
                                backgroundColor: 'transparent',
                                breakInside: 'avoid',
                                breakAfter: 'avoid',
                                fontSize: '0.9rem',
                                lineHeight: '2rem',
                                borderBottom: 'none',
                                textDecoration: 'none'
                            }}
                        >
                            {group.label}
                        </ListSubheader>,
                        ...group.keys.map(key => (
                            <MenuItem key={key} value={key} sx={{ breakInside: 'avoid' }}>
                                {Factors[key][0]}
                            </MenuItem>
                        ))
                    ])}
                </Select>
            </FormControl>
            <Box>
                <Crement
                    size='small'
                    header='slots'
                    value={maxslots[idx]}
                    name={['maxslots', idx]}
                    handleClick={handleCrement}
                    min={0}
                    max={accslots}
                />
            </Box>
        </Box>
    );
};

export default FactorForm;