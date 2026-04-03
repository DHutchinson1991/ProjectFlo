import React, { useState } from 'react';
import { Box, Chip, TextField } from '@mui/material';

export interface TagChipInputProps {
    tags: string[];
    onChange: (tags: string[]) => void;
    placeholder?: string;
}

export function TagChipInput({ tags, onChange, placeholder }: TagChipInputProps) {
    const [input, setInput] = useState('');
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if ((e.key === 'Enter' || e.key === ',') && input.trim()) {
            e.preventDefault();
            const tag = input.trim();
            if (!tags.includes(tag)) onChange([...tags, tag]);
            setInput('');
        }
        if (e.key === 'Backspace' && !input && tags.length > 0) {
            onChange(tags.slice(0, -1));
        }
    };
    return (
        <Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: tags.length > 0 ? 1 : 0 }}>
                {tags.map((tag) => (
                    <Chip
                        key={tag}
                        label={tag}
                        size="small"
                        onDelete={() => onChange(tags.filter((t) => t !== tag))}
                        sx={{
                            height: 26,
                            fontSize: '0.73rem',
                            fontWeight: 500,
                            bgcolor: 'rgba(59,130,246,0.1)',
                            color: '#93c5fd',
                            border: '1px solid rgba(59,130,246,0.18)',
                            backdropFilter: 'blur(8px)',
                            boxShadow: '0 0 8px rgba(59,130,246,0.08)',
                            '& .MuiChip-deleteIcon': { color: '#475569', fontSize: 14, '&:hover': { color: '#ef4444' } },
                        }}
                    />
                ))}
            </Box>
            <TextField
                fullWidth
                size="small"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder ?? 'Type + Enter to add…'}
                sx={{
                    '& .MuiInputBase-root': {
                        bgcolor: 'rgba(255,255,255,0.02)',
                        color: '#e2e8f0',
                        fontSize: '0.78rem',
                        borderRadius: 2,
                        height: 34,
                    },
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(100,116,139,0.1)' },
                    '& .MuiInputBase-root:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(100,116,139,0.25)' },
                    '& .MuiInputBase-root.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#3b82f6', borderWidth: 1.5 },
                }}
            />
        </Box>
    );
}
