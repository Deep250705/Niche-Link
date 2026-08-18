import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';
import { setSubscriptionStatus } from './authSlice';

// Thunks
export const fetchSubscriptionStatus = createAsyncThunk(
  'subscription/fetchStatus',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get('/subscriptions/status');
      return res.data.subscription;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch subscription');
    }
  }
);

export const upgradeSubscription = createAsyncThunk(
  'subscription/upgrade',
  async ({ planName, paymentMethodId }, { dispatch, rejectWithValue }) => {
    try {
      const res = await api.post('/subscriptions/upgrade', { planName, paymentMethodId });
      // Update status in auth slice as well
      dispatch(setSubscriptionStatus(res.data.subscription.status));
      return res.data.subscription;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Payment/Upgrade failed');
    }
  }
);

export const cancelSubscription = createAsyncThunk(
  'subscription/cancel',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      const res = await api.post('/subscriptions/cancel');
      dispatch(setSubscriptionStatus(res.data.subscription.status));
      return res.data.subscription;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Cancellation failed');
    }
  }
);

const subscriptionSlice = createSlice({
  name: 'subscription',
  initialState: {
    plan: 'Free',
    status: 'inactive',
    currentPeriod: null,
    loading: false,
    paymentState: 'idle',
    error: null
  },
  reducers: {
    resetPaymentState: (state) => {
      state.paymentState = 'idle';
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Status
      .addCase(fetchSubscriptionStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSubscriptionStatus.fulfilled, (state, action) => {
        if (action.payload) {
          state.plan = action.payload.plan || 'Free';
          state.status = action.payload.status || 'inactive';
          state.currentPeriod = action.payload.currentPeriodEnd || null;
        }
        state.loading = false;
      })
      .addCase(fetchSubscriptionStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Upgrade
      .addCase(upgradeSubscription.pending, (state) => {
        state.loading = true;
        state.paymentState = 'processing';
        state.error = null;
      })
      .addCase(upgradeSubscription.fulfilled, (state, action) => {
        state.plan = action.payload.plan;
        state.status = action.payload.status;
        state.currentPeriod = action.payload.currentPeriodEnd;
        state.paymentState = 'succeeded';
        state.loading = false;
      })
      .addCase(upgradeSubscription.rejected, (state, action) => {
        state.paymentState = 'failed';
        state.loading = false;
        state.error = action.payload;
      })
      // Cancel
      .addCase(cancelSubscription.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(cancelSubscription.fulfilled, (state, action) => {
        state.status = action.payload.status;
        state.loading = false;
      })
      .addCase(cancelSubscription.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { resetPaymentState } = subscriptionSlice.actions;

export default subscriptionSlice.reducer;
