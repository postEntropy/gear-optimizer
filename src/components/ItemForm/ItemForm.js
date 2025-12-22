import React from 'react';
import { Button, TextField, Box, Stack, Typography } from '@mui/material';
import { getLock, getSlot } from '../../util'

class LockButton extends React.Component {
    render() {
        const id = this.props.editItem[1];
        const lockable = this.props.editItem[3];
        if (!lockable || this.props.itemdata[id].empty) {
            return <></>
        }
        const slot = getSlot(id, this.props.itemdata);
        const idx = this.props.equip[slot[0]].indexOf(id);
        const locked = getLock(slot[0], idx, this.props.locked);
        return <Button variant="outlined" onClick={() => this.props.handleLockItem(!locked, slot[0], idx)}>{
            locked
                ? 'Unlock'
                : 'Lock'
        }</Button>
    }
}

export default class ItemForm extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            value: this.props.editItem[2]
        };

        this.handleChange = this.handleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    handleSubmit(event) {
        this.props.handleEditItem(this.props.editItem[1], this.state.value)
        event.preventDefault();
        this.props.closeEditModal();
    }

    handleChange(event) {
        let val = event.target.value;
        while (val[0] === '0') {
            val = val.substr(1);
        }
        if (val.length === 0) {
            val = 0;
        } else {
            val = Number(val);
        }
        if (isNaN(val)) {
            val = 100;
        }
        this.setState({ value: val });
    }

    handleFocus(event) {
        event.target.select();
    }

    render() {
        const item = this.props.itemdata[this.props.editItem[1]];
        let able = 'Disable';
        if (item !== undefined && item.disable) {
            able = 'Enable'
        }
        let header = '';
        if (item !== undefined) {
            header = '(' + item.id + ') ' + item.name;
        }
        return (
            <Box component="form" onSubmit={this.handleSubmit} sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Typography variant="h6">{header || 'Edit Item'}</Typography>
                <TextField
                    label="Level"
                    value={this.state.value}
                    onChange={this.handleChange}
                    onFocus={this.handleFocus}
                    autoFocus
                    type="number"
                    variant="outlined"
                />
                <Stack direction="row" spacing={1} flexWrap="wrap">
                    <Button type="submit" variant="contained">Update</Button>
                    <Button variant="outlined" color={able === 'Disable' ? 'error' : 'success'} onClick={() => this.props.handleDisableItem(this.props.editItem[1])}>
                        {able}
                    </Button>
                    <LockButton {...this.props} />
                    <Button variant="text" onClick={this.props.closeEditModal}>Cancel</Button>
                </Stack>
            </Box>
        );
    }
}
