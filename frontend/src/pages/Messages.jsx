import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchConversations, fetchMessages, sendMessage, setActiveConversation } from '../store/slices/messageSlice';
import { getSocket } from '../services/socket';
import Avatar from '../components/Avatar';
import Loading from '../components/Loading';

const Messages = () => {
  const dispatch = useDispatch();
  const currentUser = useSelector((state) => state.auth.currentUser);
  const { conversations, activeConversation, messages, socketConnected, loading } = useSelector((state) => state.message);
  
  const [text, setText] = useState('');
  const [partnerTyping, setPartnerTyping] = useState(false);
  
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    dispatch(fetchConversations());
  }, [dispatch]);

  // Handle active conversation room change
  useEffect(() => {
    if (activeConversation) {
      dispatch(fetchMessages(activeConversation._id));
      
      const socket = getSocket();
      if (socket) {
        socket.emit('joinConversation', { conversationId: activeConversation._id });
        socket.emit('messageRead', { conversationId: activeConversation._id });
      }

      setPartnerTyping(false);
      
      return () => {
        if (socket) {
          socket.emit('leaveConversation', { conversationId: activeConversation._id });
        }
      };
    }
  }, [activeConversation, dispatch]);

  // Bind typing indicators listeners
  useEffect(() => {
    const socket = getSocket();
    if (!socket || !activeConversation) return;

    const handlePartnerTyping = ({ conversationId, userId }) => {
      if (conversationId === activeConversation._id && userId !== currentUser?.id) {
        setPartnerTyping(true);
      }
    };

    const handlePartnerStopTyping = ({ conversationId, userId }) => {
      if (conversationId === activeConversation._id && userId !== currentUser?.id) {
        setPartnerTyping(false);
      }
    };

    socket.on('typing', handlePartnerTyping);
    socket.on('stopTyping', handlePartnerStopTyping);

    return () => {
      socket.off('typing', handlePartnerTyping);
      socket.off('stopTyping', handlePartnerStopTyping);
    };
  }, [activeConversation, currentUser]);

  useEffect(() => {
    // Scroll to bottom
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, partnerTyping]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim() || !activeConversation) return;

    const receiver = activeConversation.participants?.find(p => p._id !== currentUser.id);
    const receiverId = receiver?._id || receiver;

    const socket = getSocket();
    if (socket) {
      socket.emit('sendMessage', {
        conversationId: activeConversation._id,
        receiverId,
        content: text
      });
      socket.emit('stopTyping', { conversationId: activeConversation._id });
    } else {
      await dispatch(sendMessage({
        conversationId: activeConversation._id,
        receiverId,
        content: text
      }));
    }
    
    setText('');
  };

  const handleInputChange = (e) => {
    setText(e.target.value);
    const socket = getSocket();
    if (socket && activeConversation) {
      socket.emit('typing', { conversationId: activeConversation._id });
      
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('stopTyping', { conversationId: activeConversation._id });
      }, 2000);
    }
  };

  const handleSelectConv = (conv) => {
    dispatch(setActiveConversation(conv));
  };

  if (loading && conversations.length === 0) return <Loading />;

  return (
    <div className="container py-3" style={{ height: 'calc(100vh - 130px)' }}>
      <div className="row h-100 g-4">
        {/* Conversations List Column */}
        <div className="col-md-4 h-100 d-flex flex-column">
          <div className="nl-card p-3 h-100 d-flex flex-column overflow-hidden">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h3 className="h6 text-white mb-0 fw-bold text-uppercase" style={{ letterSpacing: '0.05em' }}>Messages</h3>
              <span className={`badge ${socketConnected ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'} rounded-pill px-2 py-0.5`} style={{ fontSize: '0.65rem' }}>
                {socketConnected ? '● Live' : 'Offline'}
              </span>
            </div>

            <div className="flex-grow-1 overflow-y-auto d-flex flex-column gap-2 pe-1">
              {conversations.length === 0 ? (
                <div className="text-center py-5 text-secondary small">No active conversations.</div>
              ) : (
                conversations.map((conv) => {
                  const partner = conv.participants?.find(p => p._id !== currentUser?.id) || {};
                  const isActive = activeConversation?._id === conv._id;
                  return (
                    <div
                      key={conv._id}
                      onClick={() => handleSelectConv(conv)}
                      className={`d-flex align-items-center gap-2.5 p-2.5 rounded transition`}
                      style={{ 
                        cursor: 'pointer',
                        backgroundColor: isActive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255,255,255,0.01)',
                        border: '1px solid',
                        borderColor: isActive ? 'var(--nl-accent-primary)' : 'var(--nl-border-color)'
                      }}
                    >
                      <Avatar name={partner.name} src={partner.avatar} size={40} />
                      <div className="flex-grow-1 overflow-hidden">
                        <div className="d-flex justify-content-between align-items-center">
                          <span className={`fw-semibold text-truncate small ${isActive ? 'text-white' : 'text-light'}`}>{partner.name}</span>
                          <small className="text-muted" style={{ fontSize: '0.68rem' }}>{conv.lastMessage ? new Date(conv.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</small>
                        </div>
                        <p className="text-truncate mb-0 text-secondary" style={{ fontSize: '0.72rem' }}>{conv.lastMessage?.content || 'No messages yet'}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Chat Feed Column */}
        <div className="col-md-8 h-100 d-flex flex-column">
          <div className="nl-card h-100 d-flex flex-column overflow-hidden">
            {activeConversation ? (
              <>
                {/* Active Partner Info */}
                {(() => {
                  const partner = activeConversation.participants?.find(p => p._id !== currentUser?.id) || {};
                  return (
                    <div className="d-flex align-items-center gap-3 p-3 border-bottom" style={{ borderColor: 'var(--nl-border-color) !important' }}>
                      <Avatar name={partner.name} src={partner.avatar} size={40} />
                      <div>
                        <h4 className="h6 text-white mb-0 fw-bold">{partner.name}</h4>
                        <small className="text-secondary" style={{ fontSize: '0.72rem' }}>@{partner.username} • Available</small>
                      </div>
                    </div>
                  );
                })()}

                {/* Message Log */}
                <div className="flex-grow-1 overflow-y-auto p-3 d-flex flex-column gap-3">
                  {messages.map((msg) => {
                    const isSent = msg.sender === currentUser?.id || msg.sender?._id === currentUser?.id;
                    return (
                      <div key={msg._id} className={`d-flex flex-column ${isSent ? 'align-items-end' : 'align-items-start'}`}>
                        <div className={isSent ? 'nl-chat-bubble-sent' : 'nl-chat-bubble-received'}>
                          <p className="mb-0 small">{msg.content}</p>
                        </div>
                        <small className="text-secondary mt-1 px-1" style={{ fontSize: '0.68rem' }}>
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {isSent && msg.isRead && <span className="ms-1.5 text-success"> ✓</span>}
                        </small>
                      </div>
                    );
                  })}
                  
                  {partnerTyping && (
                    <div className="d-flex align-items-center gap-2 text-secondary px-2 py-1" style={{ fontSize: '0.72rem' }}>
                      💬 <span className="fst-italic">Typing...</span>
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input Editor */}
                <form onSubmit={handleSend} className="p-3 border-top d-flex gap-2" style={{ borderColor: 'var(--nl-border-color) !important' }}>
                  <input
                    type="text"
                    className="form-control nl-input flex-grow-1"
                    placeholder="Type a secure message..."
                    value={text}
                    onChange={handleInputChange}
                  />
                  <button type="submit" className="btn nl-btn nl-btn-primary px-4 py-2">
                    Send
                  </button>
                </form>
              </>
            ) : (
              <div className="d-flex flex-column align-items-center justify-content-center h-100 text-secondary p-4">
                <span className="fs-1 mb-2">💬</span>
                <h5 className="text-white fw-bold">Direct Messaging</h5>
                <p className="small text-center text-secondary" style={{ maxWidth: '320px' }}>Select an active tribe member's conversation thread to start networking.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Messages;
