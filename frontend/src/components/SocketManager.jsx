import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectIsAuthenticated } from '../store/slices/authSlice';
import { initiateSocketConnection, disconnectSocket } from '../services/socket';
import { receiveMessage, setSocketState } from '../store/slices/messageSlice';
import { receiveNotification } from '../store/slices/notificationSlice';

const SocketManager = () => {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector(selectIsAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) {
      disconnectSocket();
      dispatch(setSocketState(false));
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) return;

    const socket = initiateSocketConnection(token);

    socket.on('connect', () => {
      console.log('Socket connection established.');
      dispatch(setSocketState(true));
    });

    socket.on('disconnect', () => {
      console.log('Socket connection lost.');
      dispatch(setSocketState(false));
    });

    socket.on('newMessage', (message) => {
      dispatch(receiveMessage(message));
    });

    socket.on('newNotification', (notification) => {
      dispatch(receiveNotification(notification));
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('newMessage');
      socket.off('newNotification');
      disconnectSocket();
      dispatch(setSocketState(false));
    };
  }, [isAuthenticated, dispatch]);

  return null;
};

export default SocketManager;
