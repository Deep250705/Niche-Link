import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import communityReducer from './slices/communitySlice';
import postReducer from './slices/postSlice';
import messageReducer from './slices/messageSlice';
import subscriptionReducer from './slices/subscriptionSlice';
import notificationReducer from './slices/notificationSlice';
import projectReducer from './slices/projectSlice';
import uiReducer from './slices/uiSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    community: communityReducer,
    post: postReducer,
    message: messageReducer,
    subscription: subscriptionReducer,
    notification: notificationReducer,
    project: projectReducer,
    ui: uiReducer
  }
});

export default store;
