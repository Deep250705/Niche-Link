import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// Thunks
export const fetchCommunities = createAsyncThunk(
  'community/fetchAll',
  async (search = '', { rejectWithValue }) => {
    try {
      const url = search ? `/communities?search=${encodeURIComponent(search)}` : '/communities';
      const res = await api.get(url);
      return res.data.communities;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch tribes');
    }
  }
);

export const fetchCommunityBySlug = createAsyncThunk(
  'community/fetchBySlug',
  async (slug, { rejectWithValue }) => {
    try {
      const res = await api.get(`/communities/${slug}`);
      return res.data.community;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch tribe details');
    }
  }
);

export const joinCommunity = createAsyncThunk(
  'community/join',
  async (communityId, { rejectWithValue }) => {
    try {
      const res = await api.post(`/communities/${communityId}/join`);
      return { communityId, data: res.data };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to join tribe');
    }
  }
);

export const leaveCommunity = createAsyncThunk(
  'community/leave',
  async (communityId, { rejectWithValue }) => {
    try {
      const res = await api.post(`/communities/${communityId}/leave`);
      return { communityId, data: res.data };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to leave tribe');
    }
  }
);

const communitySlice = createSlice({
  name: 'community',
  initialState: {
    communities: [],
    activeCommunity: null,
    memberships: [], // list of community IDs joined
    loading: false,
    error: null
  },
  reducers: {
    clearActiveCommunity: (state) => {
      state.activeCommunity = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch All
      .addCase(fetchCommunities.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCommunities.fulfilled, (state, action) => {
        state.communities = action.payload;
        state.loading = false;
      })
      .addCase(fetchCommunities.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch by Slug
      .addCase(fetchCommunityBySlug.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCommunityBySlug.fulfilled, (state, action) => {
        state.activeCommunity = action.payload;
        state.loading = false;
      })
      .addCase(fetchCommunityBySlug.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Join
      .addCase(joinCommunity.fulfilled, (state, action) => {
        const { communityId, data } = action.payload;
        if (state.activeCommunity && state.activeCommunity._id === communityId) {
          state.activeCommunity.members = data.members;
          state.activeCommunity.memberCount = data.memberCount;
        }
        if (!state.memberships.includes(communityId)) {
          state.memberships.push(communityId);
        }
      })
      // Leave
      .addCase(leaveCommunity.fulfilled, (state, action) => {
        const { communityId, data } = action.payload;
        if (state.activeCommunity && state.activeCommunity._id === communityId) {
          state.activeCommunity.members = data.members;
          state.activeCommunity.memberCount = data.memberCount;
        }
        state.memberships = state.memberships.filter(id => id !== communityId);
      });
  }
});

export const { clearActiveCommunity } = communitySlice.actions;

export const selectCommunityState = (state) => state.community;
export const selectActiveCommunity = (state) => state.community.activeCommunity;

export default communitySlice.reducer;
