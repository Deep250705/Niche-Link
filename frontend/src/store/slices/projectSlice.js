import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// Thunks
export const fetchProjects = createAsyncThunk(
  'project/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get('/projects');
      return res.data.projects || [];
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch project listings');
    }
  }
);

export const fetchProjectDetails = createAsyncThunk(
  'project/fetchDetails',
  async (projectId, { rejectWithValue }) => {
    try {
      const res = await api.get(`/projects/${projectId}`);
      return res.data.project;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch project details');
    }
  }
);

export const applyForProject = createAsyncThunk(
  'project/apply',
  async ({ projectId, applicationData }, { rejectWithValue }) => {
    try {
      const res = await api.post(`/projects/${projectId}/apply`, applicationData);
      return res.data.application;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Application submission failed');
    }
  }
);

const projectSlice = createSlice({
  name: 'project',
  initialState: {
    projectListings: [],
    selectedProject: null,
    applications: [],
    loading: false,
    error: null
  },
  reducers: {
    clearSelectedProject: (state) => {
      state.selectedProject = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch All Projects
      .addCase(fetchProjects.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProjects.fulfilled, (state, action) => {
        state.projectListings = action.payload;
        state.loading = false;
      })
      .addCase(fetchProjects.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch Details
      .addCase(fetchProjectDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProjectDetails.fulfilled, (state, action) => {
        state.selectedProject = action.payload;
        state.loading = false;
      })
      .addCase(fetchProjectDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Apply
      .addCase(applyForProject.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(applyForProject.fulfilled, (state, action) => {
        state.applications.push(action.payload);
        state.loading = false;
      })
      .addCase(applyForProject.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { clearSelectedProject } = projectSlice.actions;

export default projectSlice.reducer;
