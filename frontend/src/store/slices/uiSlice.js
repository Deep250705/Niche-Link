import { createSlice } from '@reduxjs/toolkit';

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    theme: localStorage.getItem('theme') || 'dark',
    sidebarOpen: false,
    modalOpen: false,
    activeModal: null
  },
  reducers: {
    toggleTheme: (state) => {
      state.theme = state.theme === 'dark' ? 'light' : 'dark';
      localStorage.setItem('theme', state.theme);
    },
    setSidebarOpen: (state, action) => {
      state.sidebarOpen = action.payload;
    },
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    openModal: (state, action) => {
      state.modalOpen = true;
      state.activeModal = action.payload;
    },
    closeModal: (state) => {
      state.modalOpen = false;
      state.activeModal = null;
    }
  }
});

export const { toggleTheme, setSidebarOpen, toggleSidebar, openModal, closeModal } = uiSlice.actions;

export default uiSlice.reducer;
