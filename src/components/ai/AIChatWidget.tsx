import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, X, Bot, User, Sparkles, Mic, Loader2 } from 'lucide-react';
import { api } from '../../lib/api';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export const AIChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Namaste! I am RailSync AI, your intelligent assistant for AABPS. Ask me about defects, blocks, AAI metrics, or report a defect in Hindi/English. How can I help you today?',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'chat' | 'defect'>('chat');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg: Message = { role: 'user', content: input.trim(), timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      if (mode === 'defect') {
        const defect = await api.ai.smartDefect(userMsg.content);
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: `Defect created successfully!\n\nID: ${defect.id}\nType: ${defect.defect_type}\nSection: ${defect.section} (KM ${defect.km_from})\nDepartment: ${defect.department}\nCriticality: ${defect.criticality}\nAI Priority Score: ${Math.round(defect.priority_score)}/99\nTSR Required: ${defect.requires_tsr ? 'Yes' : 'No'}\n\nThe defect has been added to the unified queue and AI-scored automatically.`,
            timestamp: new Date(),
          },
        ]);
        setMode('chat');
      } else {
        const res = await api.ai.chat(userMsg.content);
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: res.reply, timestamp: new Date() },
        ]);
      }
    } catch (e: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `Error: ${e.message || 'AI service unavailable. Please try again.'}`,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const quickActions = [
    { label: 'Report Defect (Hindi/EN)', action: () => { setMode('defect'); setInput(''); setMessages(prev => [...prev, { role: 'assistant', content: 'Defect reporting mode activated. Describe the defect in Hindi or English — I will extract all details automatically.\n\nExample: "KYN-KJT section me km 67 pe rail fracture hai, speed restriction laga hua hai"', timestamp: new Date() }]); } },
    { label: 'Executive Summary', action: async () => { setLoading(true); try { const res = await api.ai.executiveSummary(); setMessages(prev => [...prev, { role: 'assistant', content: `📋 DRM Executive Briefing:\n\n${res.summary}`, timestamp: new Date() }]); } catch (e: any) { setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${e.message}`, timestamp: new Date() }]); } finally { setLoading(false); } } },
    { label: 'Defect Insights', action: async () => { setLoading(true); try { const res = await api.ai.defectInsights(); setMessages(prev => [...prev, { role: 'assistant', content: `📊 AI Defect Analysis:\n\n${res.insights}`, timestamp: new Date() }]); } catch (e: any) { setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${e.message}`, timestamp: new Date() }]); } finally { setLoading(false); } } },
  ];

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 1000,
          width: 56, height: 56, borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--amber-700), var(--amber-600))',
          border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 20px rgba(180,83,9,0.4)',
          transition: 'transform 0.2s, box-shadow 0.2s',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.1)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
      >
        <MessageSquare size={24} color="#fff" />
        <span style={{
          position: 'absolute', top: -2, right: -2,
          width: 16, height: 16, borderRadius: '50%',
          background: 'var(--rail-snt)', border: '2px solid #fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Sparkles size={8} color="#fff" />
        </span>
      </button>
    );
  }

  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 1000,
      width: 400, height: 560, borderRadius: 20,
      background: 'var(--bg-surface)',
      border: '1px solid var(--border-soft)',
      boxShadow: '0 12px 40px rgba(44,26,14,0.2)',
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '14px 18px',
        background: 'linear-gradient(135deg, var(--amber-700), #92400e)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Bot size={20} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>RailSync AI</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)' }}>
              Groq GPT-OSS 120B · {mode === 'defect' ? 'Defect Reporting Mode' : 'Chat Mode'}
            </div>
          </div>
        </div>
        <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.8)' }}>
          <X size={18} />
        </button>
      </div>

      {/* Quick Actions */}
      <div style={{ padding: '8px 12px', display: 'flex', gap: 6, flexWrap: 'wrap', borderBottom: '1px solid var(--border-soft)', background: 'var(--bg-raised)' }}>
        {quickActions.map((qa) => (
          <button
            key={qa.label}
            onClick={qa.action}
            disabled={loading}
            className="chip"
            style={{ cursor: 'pointer', fontSize: 10, padding: '4px 10px', background: 'var(--bg-surface)', border: '1px solid var(--border-soft)', color: 'var(--amber-700)', fontWeight: 700 }}
          >
            {qa.label}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row' }}>
            <div style={{
              width: 28, height: 28, borderRadius: 8, flexShrink: 0,
              background: msg.role === 'user' ? 'var(--rail-eng)' : 'var(--amber-100)',
              border: msg.role === 'user' ? 'none' : '1px solid var(--amber-300)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {msg.role === 'user' ? <User size={14} color="#fff" /> : <Bot size={14} color="var(--amber-700)" />}
            </div>
            <div style={{
              maxWidth: '80%', padding: '10px 14px', borderRadius: 14,
              background: msg.role === 'user' ? 'var(--rail-eng)' : 'var(--bg-raised)',
              color: msg.role === 'user' ? '#fff' : 'var(--text-primary)',
              border: msg.role === 'user' ? 'none' : '1px solid var(--border-soft)',
              fontSize: 12, lineHeight: 1.5, whiteSpace: 'pre-wrap',
            }}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--amber-100)', border: '1px solid var(--amber-300)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Loader2 size={14} color="var(--amber-700)" style={{ animation: 'spin 1s linear infinite' }} />
            </div>
            <span className="font-mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>RailSync AI is thinking...</span>
          </div>
        )}
      </div>

      {/* Input */}
      <div style={{ padding: '10px 14px', borderTop: '1px solid var(--border-soft)', background: 'var(--bg-raised)' }}>
        {mode === 'defect' && (
          <div style={{ marginBottom: 6, padding: '4px 10px', background: 'var(--amber-100)', borderRadius: 8, fontSize: 10, fontWeight: 700, color: 'var(--amber-700)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Defect Reporting Mode (Hindi/English)</span>
            <button onClick={() => setMode('chat')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 10, fontWeight: 700, color: 'var(--amber-700)', textDecoration: 'underline' }}>Exit</button>
          </div>
        )}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={mode === 'defect' ? 'Describe defect in Hindi/English...' : 'Ask RailSync AI anything...'}
            disabled={loading}
            className="font-mono"
            style={{
              flex: 1, padding: '10px 14px', borderRadius: 12,
              border: '1px solid var(--border-soft)', background: 'var(--bg-surface)',
              fontSize: 12, color: 'var(--text-primary)', outline: 'none',
            }}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || loading}
            style={{
              width: 38, height: 38, borderRadius: 10,
              background: input.trim() ? 'var(--amber-700)' : 'var(--bg-raised)',
              border: 'none', cursor: input.trim() ? 'pointer' : 'default',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 0.15s',
            }}
          >
            <Send size={16} color={input.trim() ? '#fff' : 'var(--text-muted)'} />
          </button>
        </div>
      </div>
    </div>
  );
};
