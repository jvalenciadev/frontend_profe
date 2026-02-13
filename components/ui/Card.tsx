'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    hover?: boolean;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
    ({ className, hover = true, children, style, onClick, onMouseEnter, onMouseLeave }, ref) => {
        return (
            <motion.div
                ref={ref}
                whileHover={hover ? { y: -4, scale: 1.005 } : {}}
                transition={{ duration: 0.3, ease: "easeOut" }}
                style={style}
                onClick={onClick}
                onMouseEnter={onMouseEnter}
                onMouseLeave={onMouseLeave}
                className={cn(
                    'bg-card border border-border/60 shadow-sm rounded-2xl overflow-hidden transition-all',
                    className
                )}
            >
                {children}
            </motion.div>
        );
    }
);
Card.displayName = 'Card';

export { Card };
