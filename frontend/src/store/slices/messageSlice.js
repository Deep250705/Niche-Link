import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// Thunks
export const fetchConversations = createAsyncThunk(
  'message/fetchConversations',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get('/conversations');
      return res.data.conversations || [];
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch conversations');
    }
  }
);

export const fetchMessages = createAsyncThunk(
  'message/fetchMessages',
  async (conversationId, { rejectWithValue }) => {
    try {
      const res = await api.get(`/messages/${conversationId}`);
      return res.data.messages || [];
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to load messages');
    }
  }
);

export const sendMessage = createAsyncThunk(
  'message/sendMessage',
  async ({ conversationId, receiverId, content }, { rejectWithValue }) => {
    try {
      const res = await api.post('/messages', { conversationId, receiverId, content });
      return res.data.message;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to send message');
    }
  }
);

const messageSlice = createSlice({
  name: 'message',
  initialState: {
    conversations: [],
    activeConversation: null,
    messages: [],
    unreadCount: 0,
    socketConnected: false,
    loading: false,
    error: null
  },
  reducers: {
    setActiveConversation: (state, action) => {
      state.activeConversation = action.payload;
    },
    receiveMessage: (state, action) => {
      const msg = action.payload;
      // Add message to active conversation if it matches
      if (state.activeConversation && state.activeConversation._id === msg.conversation) {
        state.messages.push(msg);
      }
      // Update unread count if applicable
      if (!state.activeConversation || state.activeConversation._id !== msg.conversation) {
        state.unreadCount += 1;
      }
    },
    setSocketState: (state, action) => {
      state.socketConnected = action.payload;
    },
    clearMessagesError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Conversations
      .addCase(fetchConversations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchConversations.fulfilled, (state, action) => {
        state.conversations = action.payload;
        state.unreadCount = action.payload.reduce((acc, c) => acc + (c.unreadCount || 0), 0);
        state.loading = false;
      })
      .addCase(fetchConversations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch Messages
      .addCase(fetchMessages.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.messages = action.payload;
        state.loading = false;
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Send Message
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.messages.push(action.payload);
        // Move conversation to top and update snippet
        state.conversations = state.conversations.map(c => {
          if (c._id === action.payload.conversation) {
            return { ...c, lastMessage: action.payload };
          }
          return c;
        });
      });
  }
});

export const { setActiveConversation, receiveMessage, setSocketState, clearMessagesError } = messageSlice.actions;

export default messageSlice.reducer;
