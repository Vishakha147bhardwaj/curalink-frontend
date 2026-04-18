import React, { useRef, useState, useEffect } from 'react';
import PropTypes from 'prop-types';

function InputBar({ onSend, loading }) {
  const textareaRef = useRef(null);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);

  // Setup speech recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (e) => {
      const transcript = Array.from(e.results)
        .map(r => r[0].transcript)
        .join('');
      if (textareaRef.current) {
        textareaRef.current.value = transcript;
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height =
          Math.min(textareaRef.current.scrollHeight, 120) + 'px';
      }
    };

    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognitionRef.current = recognition;
  }, []);

  const toggleVoice = () => {
    if (!recognitionRef.current) {
      alert('Voice input is not supported in this browser. Try Chrome.');
      return;
    }
    if (listening) {
      recognitionRef.current.stop();
      setListening(false);
    } else {
      recognitionRef.current.start();
      setListening(true);
    }
  };

  const handleSend = () => {
    const text = textareaRef.current?.value.trim();
    if (!text || loading) return;
    if (listening) { recognitionRef.current?.stop(); setListening(false); }
    onSend(text);
    textareaRef.current.value = '';
    textareaRef.current.style.height = 'auto';
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e) => {
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
  };

  const hasVoiceSupport = !!(window.SpeechRecognition || window.webkitSpeechRecognition);

  return (
    <div className="cl-input-bar">
      <div className={`cl-input-wrap ${listening ? 'cl-input-listening' : ''}`}>
        {/* Voice mic button */}
        {hasVoiceSupport && (
          <button
            className={`cl-mic-btn ${listening ? 'cl-mic-active' : ''}`}
            onClick={toggleVoice}
            type="button"
            title={listening ? 'Stop listening' : 'Voice input'}
            disabled={loading}
          >
            {listening ? (
              // Animated mic when listening
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <rect x="5" y="1" width="6" height="9" rx="3" fill="currentColor" />
                <path d="M2 7c0 3.3 2.7 6 6 6s6-2.7 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
                <line x1="8" y1="13" x2="8" y2="15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <rect x="5" y="1" width="6" height="9" rx="3" stroke="currentColor" strokeWidth="1.4" />
                <path d="M2 7c0 3.3 2.7 6 6 6s6-2.7 6-6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                <line x1="8" y1="13" x2="8" y2="15" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
            )}
          </button>
        )}

        <textarea
          ref={textareaRef}
          rows={1}
          placeholder={listening ? '🎤 Listening...' : 'Ask about treatments, trials, guidelines…'}
          onKeyDown={handleKeyDown}
          onInput={handleInput}
          disabled={loading}
        />
      </div>

      <button
        className="cl-send-btn"
        onClick={handleSend}
        disabled={loading}
        aria-label="Send message"
      >
        {loading ? (
          <div className="cl-send-spinner" />
        ) : (
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M3 9h12M10 4l5 5-5 5"
              stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>
    </div>
  );
}

InputBar.propTypes = {
  onSend: PropTypes.func.isRequired,
  loading: PropTypes.bool.isRequired,
};

export default InputBar;