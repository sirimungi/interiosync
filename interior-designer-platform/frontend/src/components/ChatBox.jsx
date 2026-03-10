import React, { useEffect, useState, useRef } from 'react';
import { Box, TextField, Button, List, ListItem, ListItemText, Typography, Paper } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import { useSocket } from '../../context/SocketContext';
import { fetchMessages, sendMessage } from '../../api';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function ChatBox({ projectId }) {
  const [messages, setMessages] = useState([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const { lastMessage } = useSocket();
  const bottomRef = useRef(null);

  const load = () => {
    fetchMessages(projectId)
      .then((data) => setMessages([...(data || [])].reverse()))
      .catch(() => setMessages([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [projectId]);

  useEffect(() => {
    if (!lastMessage || lastMessage.type !== 'message' || lastMessage.project_id !== projectId) return;
    setMessages((prev) => [lastMessage.payload, ...prev]);
  }, [lastMessage, projectId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    sendMessage(projectId, content.trim()).then(() => setContent(''));
  };

  if (loading) return <Typography color="text.secondary">Loading messages…</Typography>;

  return (
    <Paper variant="outlined" sx={{ display: 'flex', flexDirection: 'column', height: 320 }}>
      <List sx={{ flex: 1, overflow: 'auto', p: 1 }}>
        {messages.map((m) => (
          <ListItem key={m.id} alignItems="flex-start" sx={{ flexDirection: 'column', alignItems: 'flex-start', py: 0.5 }}>
            <Typography variant="caption" color="text.secondary">
              {m.sender?.name ?? 'User'}
            </Typography>
            <ListItemText primary={m.content} primaryTypographyProps={{ variant: 'body2' }} />
          </ListItem>
        ))}
        <div ref={bottomRef} />
      </List>
      <Box component="form" onSubmit={handleSend} sx={{ p: 1, display: 'flex', gap: 1, borderTop: 1, borderColor: 'divider' }}>
        <TextField
          size="small"
          fullWidth
          placeholder="Type a message…"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <Button type="submit" variant="contained" endIcon={<SendIcon />}>Send</Button>
      </Box>
    </Paper>
  );
}
