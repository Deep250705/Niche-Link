import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// Thunks
export const fetchPosts = createAsyncThunk(
  'post/fetchAll',
  async ({ communityId = '', authorId = '', search = '', page = 1, limit = 10 } = {}, { rejectWithValue }) => {
    try {
      let query = `?page=${page}&limit=${limit}`;
      if (communityId) query += `&community=${communityId}`;
      if (authorId) query += `&author=${authorId}`;
      if (search) query += `&search=${encodeURIComponent(search)}`;
      
      const res = await api.get(`/posts${query}`);
      return res.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch discussion feed');
    }
  }
);

export const fetchPostDetails = createAsyncThunk(
  'post/fetchDetails',
  async (postId, { rejectWithValue }) => {
    try {
      const res = await api.get(`/posts/${postId}`);
      return res.data.post;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to load post details');
    }
  }
);

export const createPost = createAsyncThunk(
  'post/create',
  async (postData, { rejectWithValue }) => {
    try {
      const res = await api.post('/posts', postData);
      return res.data.post;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to share discussion post');
    }
  }
);

export const updatePost = createAsyncThunk(
  'post/update',
  async ({ postId, postData }, { rejectWithValue }) => {
    try {
      const res = await api.put(`/posts/${postId}`, postData);
      return res.data.post;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to edit post');
    }
  }
);

export const deletePost = createAsyncThunk(
  'post/delete',
  async (postId, { rejectWithValue }) => {
    try {
      await api.delete(`/posts/${postId}`);
      return postId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete post');
    }
  }
);

const postSlice = createSlice({
  name: 'post',
  initialState: {
    feed: [],
    selectedPost: null,
    pagination: {
      page: 1,
      limit: 10,
      totalPages: 1,
      totalPosts: 0
    },
    loading: false,
    error: null
  },
  reducers: {
    clearSelectedPost: (state) => {
      state.selectedPost = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch All Feed Posts
      .addCase(fetchPosts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPosts.fulfilled, (state, action) => {
        state.feed = action.payload.posts;
        state.pagination = action.payload.pagination || state.pagination;
        state.loading = false;
      })
      .addCase(fetchPosts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch Details
      .addCase(fetchPostDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPostDetails.fulfilled, (state, action) => {
        state.selectedPost = action.payload;
        state.loading = false;
      })
      .addCase(fetchPostDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Create Post
      .addCase(createPost.fulfilled, (state, action) => {
        state.feed = [action.payload, ...state.feed];
      })
      // Update Post
      .addCase(updatePost.fulfilled, (state, action) => {
        state.feed = state.feed.map(p => p._id === action.payload._id ? action.payload : p);
        if (state.selectedPost && state.selectedPost._id === action.payload._id) {
          state.selectedPost = action.payload;
        }
      })
      // Delete Post
      .addCase(deletePost.fulfilled, (state, action) => {
        state.feed = state.feed.filter(p => p._id !== action.payload);
        if (state.selectedPost && state.selectedPost._id === action.payload) {
          state.selectedPost = null;
        }
      });
  }
});

export const { clearSelectedPost } = postSlice.actions;

export const selectPostState = (state) => state.post;
export const selectFeed = (state) => state.post.feed;
export const selectSelectedPost = (state) => state.post.selectedPost;

export default postSlice.reducer;
