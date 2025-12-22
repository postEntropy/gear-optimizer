import React from 'react';
import { TextField, Button, Box, Stack } from '@mui/material';

export default class ExportForm extends React.Component {
    handleFocus(event) {
        event.target.select();
    }

    handleClose() {
        this.fresh = true;
        this.props.closeExportModal();
    }

    render() {
        return (
            <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                    label="Current loadout"
                    value={this.props.loadoutURI}
                    InputProps={{
                        readOnly: true,
                    }}
                    onFocus={this.handleFocus}
                    fullWidth
                    variant="outlined"
                    autoFocus
                />
                <TextField
                    label="Saved loadout"
                    value={this.props.saveURI}
                    InputProps={{
                        readOnly: true,
                    }}
                    onFocus={this.handleFocus}
                    fullWidth
                    variant="outlined"
                />
                <Stack direction="row" justifyContent="flex-end">
                    <Button variant="contained" onClick={this.props.closeExportModal}>Close</Button>
                </Stack>
            </Box>
        );
    }
}
