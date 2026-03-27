"use client";

import React, { useEffect, useRef } from 'react';
import type { OutputData } from '@editorjs/editorjs';
import { Box } from '@mui/material';

interface EditorBlockProps {
    data: OutputData;
    onChange: (data: OutputData) => void;
    readOnly?: boolean;
    holderId: string;
}

const EditorBlock: React.FC<EditorBlockProps> = ({ data, onChange, readOnly = false, holderId }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const editorInstance = useRef<any>(null);

    useEffect(() => {
        if (editorInstance.current) return;

        let isMounted = true;

        const initEditor = async () => {
            // Dynamically import EditorJS and plugins so they are never evaluated
            // during SSR (they reference browser-only globals like `Element`).
            const [{ default: EditorJS }, { default: Header }, { default: List }, { default: Paragraph }] =
                await Promise.all([
                    import('@editorjs/editorjs'),
                    import('@editorjs/header'),
                    import('@editorjs/list'),
                    import('@editorjs/paragraph'),
                ]);

            if (!isMounted) return;

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
        };

        initEditor();

        return () => {
            isMounted = false;
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
