import React from 'react';
import { TextField, MenuItem } from '@mui/material';
import { Wishes } from '../../assets/ItemAux'

export default class WishForm extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            value: this.props.wishidx
        };
        this.handleChange = this.handleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    handleChange(event) {
        this.setState({ value: event.target.value });
        this.props.handleChange(event, 'wishidx', this.props.idx);
    }

    handleSubmit(event) {
        event.preventDefault();
    }

    render() {
        //HACK: this sets the dropdown to the correct value after loading
        if (this.state.value !== this.props.wishidx) {
            /* eslint-disable-next-line react/no-direct-mutation-state */
            this.state.value = this.props.wishidx;
        }
        return (
            <TextField
                select
                label={"Wish " + (this.props.idx + 1)}
                value={this.state.value}
                onChange={this.handleChange}

                sx={{ width: '200px', mr: 2, mb: 1 }}
                size="small"
            >
                {Wishes.map((wish, idx) => (
                    <MenuItem value={idx} key={idx}>{idx + ': ' + Wishes[idx][0]}</MenuItem>
                ))}
            </TextField>
        );
    }
}
