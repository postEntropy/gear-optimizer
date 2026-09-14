import React from 'react';
import { Box } from '@mui/material';

const glob = import.meta.glob('../../assets/img/*.{png,jpg,jpeg,svg}', { eager: true });
const images = Object.fromEntries(
    Object.entries(glob).map(([path, module]) => {
        const fileName = path.split('/').pop().replace(/\.[^/.]+$/, '');
        return [fileName, module.default];
    })
);

const CleaningIcon = ({ item, size = 32, plain = false }) => {
    if (!item) return null;

    let imgname = item.id;
    if (images[imgname] === undefined) {
        imgname = item.name ? item.name.replace(/</g, '').replace(/!/g, '') : '';
    }

    return (
        <Box
            component="img"
            src={images[imgname]}
            alt={item.name}
            loading="lazy"
            sx={{
                width: size,
                height: size,
                objectFit: 'contain',
                borderRadius: 1,
                bgcolor: plain ? 'transparent' : 'action.hover',
                flexShrink: 0
            }}
        />
    );
};

export default CleaningIcon;
