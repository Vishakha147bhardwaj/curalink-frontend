import React, { useRef, useState, useEffect } from 'react';
import PropTypes from 'prop-types';

export default function InputBar({ onSend, loading }) {
  const textareaRef    = useRef(null);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const r = new SR();
    r.continuous = false; r.interimResults = true; r.lang = 'en-US';
    r.onresult = (e) => {
      const t = Array.from(e.results).map(x => x[0].transcript).join('');
      if (textareaRef.current) {
        textareaRef.current.value = t;
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height =
          Math.min(textareaRef.current.scrollHeight, 120) + 'px';
      }
    };
    r.onend  = () => setListening(false);
    r.onerror = () => setListening(false);
    recognitionRef.current = r;
  }, []);

  const toggleVoice = () => {
    if (!recognitionRef.current) {
      alert('Voice input requires Chrome or Edge.');
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
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleInput = (e) => {
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
  };

  const hasVoice = !!(window.SpeechRecognition || window.webkitSpeechRecognition);

  return (
    <div className="cl-input-bar">
      <div className="cl-input-inner">
        <div className={`cl-input-wrap ${listening ? 'cl-input-listening' : ''}`}>

          {/* Textarea — takes up all available space */}
          <textarea
            ref={textareaRef}
            rows={1}
            placeholder={listening ? '🎤 Listening…' : 'Ask about treatments, trials, research…'}
            onKeyDown={handleKeyDown}
            onInput={handleInput}
            disabled={loading}
          />

          {/* Right-side actions: mic + send */}
          <div className="cl-input-actions">
            {hasVoice && (
              <button
                className={`cl-mic-btn ${listening ? 'cl-mic-active' : ''}`}
                onClick={toggleVoice}
                disabled={loading}
                title={listening ? 'Stop listening' : 'Voice input'}
                type="button"
              >
                {listening ? (
                  /* Filled mic = active */
                  <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                    <rect x="5" y="1" width="6" height="9" rx="3" fill="currentColor"/>
                    <path d="M2 7c0 3.3 2.7 6 6 6s6-2.7 6-6"
                      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    <line x1="8" y1="13" x2="8" y2="15"
                      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                ) : (
                  /* Outline mic = idle */
                  <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                    <rect x="5" y="1" width="6" height="9" rx="3"
                      stroke="currentColor" strokeWidth="1.4"/>
                    <path d="M2 7c0 3.3 2.7 6 6 6s6-2.7 6-6"
                      stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                    <line x1="8" y1="13" x2="8" y2="15"
                      stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                  </svg>
                )}
              </button>
            )}

            {/* Send button */}
            <button
              className="cl-send-btn"
              onClick={handleSend}
              disabled={loading}
              aria-label="Send"
              type="button"
            >
              {loading ? (
                <div className="cl-send-spinner" />
              ) : (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                  <path d="M22 2L11 13"
                    stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M22 2L15 22L11 13L2 9L22 2Z"
                    stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

InputBar.propTypes = {
  onSend:  PropTypes.func.isRequired,
  loading: PropTypes.bool.isRequired,
};