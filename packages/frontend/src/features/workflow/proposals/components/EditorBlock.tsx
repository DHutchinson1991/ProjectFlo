"use client";

import React, { useEffect, useRef } from 'react';
import EditorJS, { OutputData } from '@editorjs/editorjs';
import Header from '@editorjs/header';
import List from '@editorjs/list';
import Paragraph from '@editorjs/paragraph';
import { Box } from '@mui/material';

interface EditorBlockProps {
    data: OutputData;
    onChange: (data: OutputData) => void;
    readOnly?: boolean;
    holderId: string;
}

const EditorBlock: React.FC<EditorBlockProps> = ({ data, onChange, readOnly = false, holderId }) => {
    const editorInstance = useRef<EditorJS | null>(null);

    useEffect(() => {
        if (editorInstance.current) return;

        const editor = new EditorJS({
            holder: holderId,
            data: data,
            readOnly: readOnly,
            placeholder: 'Type your story here...',
            tools: {
                header: Header,
                list: List,
                paragraph: Paragraph,
            },
            onChange: async () => {
                const savedData = await editor.save();
                onChange(savedData);
            },
        });

        editorInstance.current = editor;

        return () => {
            if (editorInstance.current && editorInstance.current.destroy) {
                editorInstance.current.destroy();
                editorInstance.current = null;
            }
        };
    }, []); // Empty dependency array to init once. 
    // Note: Handling updates to `data` prop from outside needs care to avoid loops/resets. 
    // For now, we assume initial load only, or we need a way to key the component to force re-init.

    return (
        <Box 
            id={holderId} 
             sx={{ 
                '& .codex-editor__redactor': { paddingBottom: 0 },
                '& .ce-block__content': { maxWidth: '100%' }
            }}
        />
    );
};

export default EditorBlock;
