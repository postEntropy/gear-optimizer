import React, { useMemo, useState } from 'react';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import Box from '@mui/material/Box';
import ListSubheader from '@mui/material/ListSubheader';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
            <FormControl size="small" sx={{ width: 200 }}>
                <Select
                    value={factorKey}
                    onChange={handleChange}
                    displayEmpty
                    renderValue={(selected) => Factors[selected] ? Factors[selected][0] : 'Select Factor'}
                    MenuProps={{
                        autoFocus: false, // Prevent autofocusing the first item so search field works better
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
                    }}
                >
                    {/* Search Field Item */}
                    <Box
                        onKeyDown={(e) => e.stopPropagation()} // Prevent Select component from handling key events
                        sx={{ p: 1, position: 'sticky', top: 0, bgcolor: 'background.paper', zIndex: 1, borderBottom: '1px solid', borderColor: 'divider' }}
                    >
                        <TextField
                            fullWidth
                            size="small"
                            placeholder="Search factors..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key !== 'Escape') {
                                    e.stopPropagation(); // Allow typing spaces etc.
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

                    {/* Filtered Items */}
                    <Box sx={{ columnCount: 3, columnGap: '20px', p: 1, pt: 0 }}>
                        {filteredGroups.map((group) => {
                            const groupItems = group.keys.map(key => (
                                <MenuItem key={key} value={key} style={{ breakInside: 'avoid' }}>
                                    {Factors[key][0]}
                                </MenuItem>
                            ));

                            return [
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
                                ...groupItems
                            ];
                        })}
                    </Box>
                </Select>
            </FormControl>
            <Box>
                <Crement
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