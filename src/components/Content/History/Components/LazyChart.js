import React, { useRef, useState, useEffect } from 'react';
import { Box, Skeleton } from '@mui/material';

const LazyChart = ({ children, height = 400 }) => {
    const ref = useRef(null);
    const [isVisible, setIsVisible] = useState(false);
    const [hasLoaded, setHasLoaded] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !hasLoaded) {
                    setIsVisible(true);
                    setHasLoaded(true);
                }
            },
            {
                rootMargin: '200px', // Start loading 200px before visible
                threshold: 0.01
            }
        );

        if (ref.current) {
            observer.observe(ref.current);
        }

        return () => {
            if (ref.current) {
                observer.unobserve(ref.current);
            }
        };
    }, [hasLoaded]);

    return (
        <Box ref={ref} sx={{ minHeight: height }}>
            {isVisible ? (
                children
            ) : (
                <Skeleton 
                    variant="rectangular" 
                    height={height} 
                    sx={{ borderRadius: 3 }} 
                    animation="wave"
                />
            )}
        </Box>
    );
};

export default React.memo(LazyChart);
