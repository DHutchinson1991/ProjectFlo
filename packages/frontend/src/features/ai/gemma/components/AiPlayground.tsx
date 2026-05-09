'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Stack,
  Chip,
  CircularProgress,
  Slider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import { useGemmaChat, useGemmaModels } from '../hooks/useGemmaChat';
import type { ChatMessage } from '../types';

export function AiPlayground() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(512);
  const scrollRef = useRef<HTMLDivElement>(null);

  const chatMutation = useGemmaChat();
  const { data: modelsData } = useGemmaModels();

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || chatMutation.isPending) return;

    const userMessage: ChatMessage = { role: 'user', content: trimmed };
    const updated = [...messages, userMessage];
    setMessages(updated);
    setInput('');

    chatMutation.mutate(
      { messages: updated, temperature, maxTokens },
      {
        onSuccess: (data) => {
          setMessages((prev) => [
            ...prev,
            { role: 'assistant', content: data.reply },
          ]);
        },
      },
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto', height: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Stack direction="row" alignItems="center" spacing={1.5}>
        <SmartToyIcon color="primary" sx={{ fontSize: 32 }} />
        <Typography variant="h5" fontWeight={600}>
          Gemma 4 Playground
        </Typography>
        {modelsData && (
          <Chip label={modelsData.current} size="small" variant="outlined" color="primary" />
        )}
      </Stack>

      {chatMutation.isError && (
        <Alert severity="error" onClose={() => chatMutation.reset()}>
          {chatMutation.error instanceof Error
            ? chatMutation.error.message
            : 'Failed to get response from Gemma. Check that HF_TOKEN is set in the backend .env.'}
        </Alert>
      )}

      {/* Chat messages */}
      <Paper
        ref={scrollRef}
        variant="outlined"
        sx={{
          flex: 1,
          minHeight: 400,
          maxHeight: 'calc(100vh - 380px)',
          overflow: 'auto',
          p: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: 1.5,
        }}
      >
        {messages.length === 0 && (
          <Box sx={{ m: 'auto', textAlign: 'center', color: 'text.secondary' }}>
            <SmartToyIcon sx={{ fontSize: 48, opacity: 0.3, mb: 1 }} />
            <Typography variant="body2">
              Send a message to start chatting with Gemma 4
            </Typography>
          </Box>
        )}
        {messages.map((msg, i) => (
          <Box
            key={i}
            sx={{
              alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '80%',
            }}
          >
            <Paper
              elevation={0}
              sx={{
                p: 1.5,
                borderRadius: 2,
                bgcolor: msg.role === 'user' ? 'primary.main' : 'action.hover',
                color: msg.role === 'user' ? 'primary.contrastText' : 'text.primary',
              }}
            >
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                {msg.content}
              </Typography>
            </Paper>
          </Box>
        ))}
        {chatMutation.isPending && (
          <Box sx={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 1 }}>
            <CircularProgress size={16} />
            <Typography variant="body2" color="text.secondary">
              Gemma is thinking...
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Settings accordion */}
      <Accordion disableGutters variant="outlined" sx={{ '&:before': { display: 'none' } }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="body2" fontWeight={500}>
            Generation Settings
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Stack spacing={2}>
            <Box>
              <Typography variant="caption" gutterBottom>
                Temperature: {temperature}
              </Typography>
              <Slider
                value={temperature}
                onChange={(_, v) => setTemperature(v as number)}
                min={0}
                max={2}
                step={0.1}
                size="small"
              />
            </Box>
            <Box>
              <Typography variant="caption" gutterBottom>
                Max Tokens: {maxTokens}
              </Typography>
              <Slider
                value={maxTokens}
                onChange={(_, v) => setMaxTokens(v as number)}
                min={64}
                max={2048}
                step={64}
                size="small"
              />
            </Box>
          </Stack>
        </AccordionDetails>
      </Accordion>

      {/* Input area */}
      <Stack direction="row" spacing={1}>
        <TextField
          fullWidth
          multiline
          maxRows={4}
          placeholder="Type a message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={chatMutation.isPending}
          size="small"
        />
        <Button
          variant="contained"
          onClick={handleSend}
          disabled={!input.trim() || chatMutation.isPending}
          sx={{ minWidth: 48, px: 2 }}
        >
          <SendIcon fontSize="small" />
        </Button>
      </Stack>
    </Box>
  );
}
