import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { getLock } from '../../util'
import { useDrag, useDrop } from 'react-dnd';
import { Tooltip, Typography, Box } from '@mui/material';

import './Item.css';

const glob = import.meta.glob('../../assets/img/*.{png,jpg,jpeg,svg}', { eager: true });
const images = Object.fromEntries(
    Object.entries(glob).map(([path, module]) => {
        const fileName = path.split('/').pop().replace(/\.[^/.]+$/, '');
        return [fileName, module.default];
    })
);

export const SourceItem = (props) => {
    const [, drag] = useDrag(() => ({
        type: 'item',
        item: props.item,
        collect: (monitor) => ({
            isDragging: !!monitor.isDragging()
        })
    }));
    return (<div className="item-container" ref={drag}><Item {...props} /></div>);
}

export const TargetItem = (props) => {
    const [, drop] = useDrop(() => ({
        accept: 'item',
        drop: (item) => props.handleDropItem(item, props.item),
        canDrop: (item) => item.slot[0] === props.item.slot[0]
    }));
    return (<div className="item-container" ref={drop}><SourceItem {...props} /></div>);
}

const Item = (props) => {
    const { item, className, idx, locked: lockedProp, lockable, isEquipped } = props;

    // Tooltip content generation
    const tooltipContent = useMemo(() => {
        if (!item || item.empty) return <Typography variant="body2">Empty slot</Typography>;

        return (
            <Box sx={{ p: 0.5 }}>
                <Typography variant="subtitle2" fontWeight="bold">
                    {`(${item.id}) ${item.name}${item.empty ? '' : ' lvl ' + item.level}`}
                </Typography>
                {item.statnames && item.statnames.map((stat) => {
                    const formatted = (val) => {
                        if (stat === 'Power' || stat === 'Toughness') {
                            return val.toLocaleString(undefined, { maximumFractionDigits: 2 });
                        }
                        return val.toLocaleString(undefined, { maximumFractionDigits: 2 }) + '%';
                    };
                    return (
                        <Typography key={stat} variant="body2" component="div">
                            {`${stat}: ${formatted(item[stat])}`}
                        </Typography>
                    );
                })}
            </Box>
        );
    }, [item]);

    let classNames = 'item' + (className || '');
    const isLocked = lockable && getLock(item ? item.slot[0] : '', idx, lockedProp);
    if (isLocked) {
        classNames += ' lock-item'
    }
    if (isEquipped) {
        classNames += ' equipped-item'
    }
    if (item === undefined) {
        // Should typically not happen if item is required, but existing code handled it
        // However images.logo isn't guaranteed. Assuming logic matches existing.
        return (
            <Tooltip title={tooltipContent} arrow>
                <span>
                    <img className={classNames} src={images.logo} alt='Empty' />
                </span>
            </Tooltip>
        );
    }

    classNames += item.disable ? ' disable-item' : '';
    classNames += ' ' + item.slot[0]
    let imgname = item.id;
    if (images[imgname] === undefined) {
        imgname = item.name;
        imgname = imgname ? imgname.replace(/</g, '').replace(/!/g, '') : '';
    }

    return (
        <Tooltip title={tooltipContent} arrow enterDelay={200}>
            <img
                className={classNames}
                onClick={(e) => {
                    if ((e.ctrlKey || e.altKey) && props.handleCtrlClickItem !== undefined) {
                        props.handleCtrlClickItem(item.id);
                    } else if (e.shiftKey && props.handleShiftClickItem !== undefined) {
                        props.handleShiftClickItem(item.id);
                    } else {
                        props.handleClickItem(item.id);
                    }
                }}
                onContextMenu={(e) => {
                    if (!item.empty) {
                        props.handleRightClickItem(item.id);
                    }
                    e.preventDefault();
                }}
                src={images[imgname]}
                alt={item.id}
            />
        </Tooltip>
    );
};

Item.propTypes = {
    item: PropTypes.shape({ name: PropTypes.string.isRequired, level: PropTypes.number }),
    handleClickItem: PropTypes.func.isRequired,
    handleRightClickItem: PropTypes.func.isRequired
};

export default Item;
