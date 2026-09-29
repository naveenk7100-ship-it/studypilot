import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Sparkles,
  RefreshCw,
  Copy,
  Check,
  Bookmark,
  ThumbsUp,
  ThumbsDown,
  Trash2,
  Volume2,
  VolumeX,
  Mic,
  FileText,
  X,
  Plus,
  MessageSquare,
  Bot,
  User,
  Sliders,
  HelpCircle,
  Layers,
  GraduationCap,
  BookOpen,
  ArrowDownCircle,
  Lightbulb,
  ArrowRight
} from 'lucide-react';
import type {
  StudyMode,
  DifficultyLevel,
  ChatMessage,
  Conversation,
  ProcessedDocument
} from '../../types';
import { MarkdownRenderer } from '../common/MarkdownRenderer';
import { sendChatMessageStream } from '../../services/api';
import { StorageService } from '../../services/storage';
import { speechService, isSpeechRecognitionSupported, isSpeechSynthesisSupported } from '../../services/speech';

interface AITutorViewProps {
  initialPrompt?: string;
  initialMode?: StudyMode;
  pinnedDocument?: ProcessedDocument | null;
  onClearPinnedDocument?: () => void;
  onAddFlashcards?: (cards: any[]) => void;
  onStartQuizFromTopic?: (topic: string) => void;
  weakTopics?: string[];
}

export const AITutorView: React.FC<AITutorViewProps> = ({
  initialPrompt,
  initialMode = 'explain',
  pinnedDocument = null,
  onClearPinnedDocument,
  onAddFlashcards,
  onStartQuizFromTopic,
  weakTopics = []
}) => {
  const [conversations, setConversations] = useState<Conversation[]>(() => StorageService.getConversations());
  const [activeConvId, setActiveConvId] = useState<string>(() => StorageService.getActiveConversationId());
  const [inputMessage, setInputMessage] = useState('');
  const [mode, setMode] = useState<StudyMode>(initialMode);
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('intermediate');
  const [isStreaming, setIsStreaming] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const currentConv = conversations.find(c => c.id === activeConvId) || conversations[0] || {
    id: 'conv-new',
    title: 'New Study Session',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    messages: []
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentConv.messages, isStreaming]);

  useEffect(() => {
    if (initialPrompt && initialPrompt.trim()) {
      handleSendMessage(initialPrompt.trim(), initialMode);
    }
  }, [initialPrompt]);

  const updateCurrentConvMessages = (updater: (prev: ChatMessage[]) => ChatMessage[]) => {
    setConversations(prev => {
      const updated = prev.map(c => {
        if (c.id === currentConv.id) {
          const nextMsgs = updater(c.messages);
          return {
            ...c,
            updatedAt: new Date().toISOString(),
            messages: nextMsgs
          };
        }
        return c;
      });
      StorageService.saveConversations(updated);
      return updated;
    });
  };

  const handleCreateNewConversation = () => {
    const newConv: Conversation = {
      id: 'conv-' + Date.now(),
      title: 'New Study Session',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: []
    };
    const updated = [newConv, ...conversations];
    setConversations(updated);
    setActiveConvId(newConv.id);
    StorageService.saveConversations(updated);
    StorageService.setActiveConversationId(newConv.id);
    setShowHistoryDrawer(false);
  };

  const handleClearCurrentConversation = () => {
    if (window.confirm('Are you sure you want to clear this study conversation?')) {
      updateCurrentConvMessages(() => []);
    }
  };

  const handleDeleteConversation = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = conversations.filter(c => c.id !== id);
    if (updated.length === 0) {
      handleCreateNewConversation();
      return;
    }
    setConversations(updated);
    StorageService.saveConversations(updated);
    if (activeConvId === id) {
      setActiveConvId(updated[0].id);
      StorageService.setActiveConversationId(updated[0].id);
    }
  };

  const extractCurrentTopic = (text: string): string => {
    const match = text.match(/^(?:explain|what is|how does|summarize|notes on)\s+(.+?)(?:\.|\?|$)/i);
    if (match && match[1]) return match[1].trim();
    return text.slice(0, 32).trim();
  };

  const handleSendMessage = async (textToSend: string, modeOverride?: StudyMode) => {
    if (!textToSend.trim() || isStreaming) return;

    const chosenMode = modeOverride || mode;
    const userMsgId = 'msg-' + Date.now();
    const userMsg: ChatMessage = {
      id: userMsgId,
      role: 'user',
      content: textToSend,
      timestamp: new Date().toISOString(),
      mode: chosenMode,
      difficulty
    };

    const botMsgId = 'msg-' + (Date.now() + 1);
    const botPlaceholder: ChatMessage = {
      id: botMsgId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
      mode: chosenMode,
      difficulty
    };

    if (currentConv.messages.length === 0) {
      const summaryTitle = textToSend.slice(0, 36) + (textToSend.length > 36 ? '...' : '');
      setConversations(prev => {
        const u = prev.map(c => c.id === currentConv.id ? { ...c, title: summaryTitle } : c);
        StorageService.saveConversations(u);
        return u;
      });
    }

    updateCurrentConvMessages(msgs => [...msgs, userMsg, botPlaceholder]);
    setInputMessage('');
    setIsStreaming(true);

    let accumulatedContent = '';

    const docContext = pinnedDocument ? {
      fileName: pinnedDocument.fileName,
      text: pinnedDocument.rawText
    } : null;

    const currentTopic = extractCurrentTopic(textToSend);
    const studentContext = {
      topic: currentTopic,
      difficulty,
      weakTopics
    };

    await sendChatMessageStream({
      message: textToSend,
      mode: chosenMode,
      difficulty,
      documentContext: docContext,
      studentContext,
      onChunk: (chunk: string) => {
        accumulatedContent += chunk;
        updateCurrentConvMessages(msgs =>
          msgs.map(m => (m.id === botMsgId ? { ...m, content: accumulatedContent } : m))
        );
      },
      onDone: () => {
        setIsStreaming(false);
        StorageService.recordStudyTime(3);
      },
      onError: (err) => {
        setIsStreaming(false);
        accumulatedContent += `\n\n> ⚠️ **Notice:** ${err.message || 'Unable to complete request. Please verify connection and retry.'}`;
        updateCurrentConvMessages(msgs =>
          msgs.map(m => (m.id === botMsgId ? { ...m, content: accumulatedContent } : m))
        );
      }
    });
  };

  const handleRegenerate = (msgIndex: number) => {
    const prevUserMsg = currentConv.messages[msgIndex - 1];
    if (prevUserMsg && prevUserMsg.role === 'user') {
      handleSendMessage(prevUserMsg.content, prevUserMsg.mode || mode);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleToggleSpeak = (id: string, text: string) => {
    if (speakingId === id) {
      speechService.stopSpeaking();
      setSpeakingId(null);
    } else {
      setSpeakingId(id);
      speechService.speak(text, () => setSpeakingId(null));
    }
  };

  const handleSaveToNotes = (msg: ChatMessage) => {
    StorageService.addSavedNote({
      id: 'note-' + Date.now(),
      title: `${msg.mode?.toUpperCase() || 'EXPLANATION'}: ${msg.content.slice(0, 40)}...`,
      content: msg.content,
      topic: 'Saved Study Notes',
      savedAt: new Date().toISOString()
    });
    alert('Answer saved to your Study Notes!');
  };

  const handleFeedback = (msgId: string, feedback: 'like' | 'dislike') => {
    updateCurrentConvMessages(msgs =>
      msgs.map(m => (m.id === msgId ? { ...m, feedback: m.feedback === feedback ? null : feedback } : m))
    );
  };

  // Section 10: Context-Preserving AI Response Actions
  const handleContextAction = (actionType: string, botMsgIndex: number) => {
    const prevUserMsg = currentConv.messages[botMsgIndex - 1];
    const topic = prevUserMsg ? extractCurrentTopic(prevUserMsg.content) : 'this concept';

    switch (actionType) {
      case 'simpler':
        handleSendMessage(`Explain "${topic}" in simpler terms with intuitive analogies for a beginner.`, 'explain');
        break;
      case 'example':
        handleSendMessage(`Provide 2 concrete real-world engineering or practical examples of "${topic}".`, 'explain');
        break;
      case 'quiz':
        if (onStartQuizFromTopic) {
          onStartQuizFromTopic(topic);
        } else {
          handleSendMessage(`Create a 5-question diagnostic quiz on "${topic}".`, 'quiz');
        }
        break;
      case 'flashcards':
        handleSendMessage(`Generate 6 key revision flashcards for "${topic}".`, 'flashcards');
        break;
      case 'summarize':
        handleSendMessage(`Summarize "${topic}" into concise study notes with bullet points and definitions.`, 'summarize');
        break;
      case 'deeper':
        handleSendMessage(`Explain advanced nuances, mathematical formulation, and failure edge cases for "${topic}".`, 'explain');
        break;
    }
  };

  // Speech Recognition (Voice Input)
  const toggleVoiceInput = () => {
    setSpeechError(null);
    if (isListening) {
      speechService.stopListening();
      setIsListening(false);
    } else {
      if (!isSpeechRecognitionSupported()) {
        setSpeechError('Speech recognition is not supported in this browser. Try Chrome or Edge.');
        setTimeout(() => setSpeechError(null), 4000);
        return;
      }
      setIsListening(true);
      speechService.startListening(
        (transcript) => {
          setInputMessage(transcript);
        },
        () => {
          setIsListening(false);
        },
        (err) => {
          setIsListening(false);
          setSpeechError(err);
          setTimeout(() => setSpeechError(null), 4000);
        }
      );
    }
  };

  const modes: { id: StudyMode; label: string; desc: string }[] = [
    { id: 'explain', label: 'Explain', desc: '8-part structured breakdown' },
    { id: 'ask', label: 'Ask', desc: 'Direct study questions' },
    { id: 'summarize', label: 'Summarize', desc: 'Concise study bullet points' },
    { id: 'quiz', label: 'Quiz', desc: 'Self-assessment questions' },
    { id: 'flashcards', label: 'Flashcards', desc: 'Revision flashcard cards' },
    { id: 'exam_prep', label: 'Exam Prep', desc: 'Structured revision plan' },
  ];

  return (
    <div className="flex h-[calc(100vh-4.25rem)] max-w-6xl mx-auto -mx-4 sm:mx-auto relative bg-white dark:bg-slate-900 sm:rounded-2xl sm:border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
      {/* Conversation History Drawer */}
      <div
        className={`w-72 bg-slate-50 dark:bg-slate-950/60 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between shrink-0 transition-all duration-200 absolute inset-y-0 left-0 z-20 md:static ${
          showHistoryDrawer ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <button
            onClick={handleCreateNewConversation}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>New Study Session</span>
          </button>
          <button
            onClick={() => setShowHistoryDrawer(false)}
            className="p-1 text-slate-400 hover:text-slate-600 md:hidden ml-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* History List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Study Sessions
          </div>
          {conversations.map((conv) => {
            const active = conv.id === currentConv.id;
            return (
              <div
                key={conv.id}
                onClick={() => {
                  setActiveConvId(conv.id);
                  StorageService.setActiveConversationId(conv.id);
                  setShowHistoryDrawer(false);
                }}
                className={`group flex items-center justify-between px-3 py-2.5 rounded-xl text-xs cursor-pointer transition-all ${
                  active
                    ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 font-semibold shadow-2xs border border-slate-200/60 dark:border-slate-700/60'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <MessageSquare className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                  <span className="truncate">{conv.title}</span>
                </div>
                <button
                  onClick={(e) => handleDeleteConversation(conv.id, e)}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:text-rose-500 rounded transition-opacity"
                  title="Delete session"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>

        <div className="p-3 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-400 text-center">
          Encrypted Local Storage
        </div>
      </div>

      {/* Main Chat Workspace */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-white dark:bg-slate-900">
        {/* Top Control Bar: Mode, Difficulty, Mobile History Trigger */}
        <div className="px-4 py-2.5 border-b border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowHistoryDrawer(!showHistoryDrawer)}
              className="md:hidden p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
              title="Sessions history"
            >
              <MessageSquare className="w-4 h-4" />
            </button>

            {/* Mode Selector Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto py-0.5 max-w-full">
              {modes.map((m) => {
                const active = mode === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => setMode(m.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                      active
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 border border-slate-200 dark:border-slate-700/60'
                    }`}
                  >
                    {m.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Difficulty & Actions */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Sliders className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as DifficultyLevel)}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs font-medium text-slate-700 dark:text-slate-300 outline-hidden"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>

            <button
              onClick={handleClearCurrentConversation}
              className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              title="Clear chat"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Pinned Document Context Indicator */}
        {pinnedDocument && (
          <div className="px-4 py-2 bg-indigo-50 dark:bg-indigo-950/40 border-b border-indigo-100 dark:border-indigo-900/50 flex items-center justify-between text-xs text-indigo-700 dark:text-indigo-300">
            <div className="flex items-center gap-2 truncate">
              <FileText className="w-4 h-4 shrink-0 text-indigo-500" />
              <span>Grounded Answer Mode: <strong>{pinnedDocument.fileName}</strong> ({pinnedDocument.pageCount} pages)</span>
            </div>
            {onClearPinnedDocument && (
              <button
                onClick={onClearPinnedDocument}
                className="p-1 rounded hover:bg-indigo-100 dark:hover:bg-indigo-900 text-indigo-600 dark:text-indigo-400"
                title="Detach document"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {currentConv.messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto py-12 space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-inner">
                <Bot className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Ask me anything you're studying
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Ask any question, request a step-by-step breakdown, generate quizzes, or ask about your uploaded material.
                </p>
              </div>

              {/* Sample Prompts */}
              <div className="w-full space-y-2 pt-2">
                <button
                  onClick={() => handleSendMessage('Explain TCP congestion control', 'explain')}
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-blue-400 hover:bg-blue-50/30 text-left text-xs sm:text-sm text-slate-700 dark:text-slate-300 transition-all flex items-center justify-between group"
                >
                  <span className="font-medium">💡 Explain TCP congestion control</span>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all" />
                </button>
                <button
                  onClick={() => handleSendMessage('Help me understand recursion', 'explain')}
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-blue-400 hover:bg-blue-50/30 text-left text-xs sm:text-sm text-slate-700 dark:text-slate-300 transition-all flex items-center justify-between group"
                >
                  <span className="font-medium">🔄 Help me understand recursion</span>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all" />
                </button>
                <button
                  onClick={() => handleSendMessage('Teach me photosynthesis', 'explain')}
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-blue-400 hover:bg-blue-50/30 text-left text-xs sm:text-sm text-slate-700 dark:text-slate-300 transition-all flex items-center justify-between group"
                >
                  <span className="font-medium">🌱 Teach me photosynthesis</span>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all" />
                </button>
                <button
                  onClick={() => handleSendMessage('Explain normalization in DBMS', 'explain')}
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-blue-400 hover:bg-blue-50/30 text-left text-xs sm:text-sm text-slate-700 dark:text-slate-300 transition-all flex items-center justify-between group"
                >
                  <span className="font-medium">🗄️ Explain normalization in DBMS</span>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all" />
                </button>
              </div>
            </div>
          ) : (
            currentConv.messages.map((msg, index) => {
              const isUser = msg.role === 'user';
              const isLastBotMsg = !isUser && index === currentConv.messages.length - 1;

              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 sm:gap-4 ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  {!isUser && (
                    <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shrink-0 mt-0.5 shadow-2xs">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div className="max-w-[90%] sm:max-w-[80%] space-y-2">
                    {/* Message Bubble */}
                    <div
                      className={`p-4 sm:p-5 rounded-2xl ${
                        isUser
                          ? 'bg-blue-600 text-white rounded-tr-xs shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-800/70 text-slate-900 dark:text-slate-100 rounded-tl-xs border border-slate-200/80 dark:border-slate-700/60 shadow-2xs'
                      }`}
                    >
                      {isUser ? (
                        <div className="text-sm sm:text-base font-normal whitespace-pre-wrap">
                          {msg.content}
                        </div>
                      ) : !msg.content && isStreaming && isLastBotMsg ? (
                        /* Section 3: Thinking... State */
                        <div className="flex items-center gap-2 py-2 text-xs font-semibold text-blue-600 dark:text-blue-400 animate-pulse">
                          <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-ping" />
                          <span>Thinking and synthesizing explanation...</span>
                        </div>
                      ) : (
                        <MarkdownRenderer content={msg.content || 'Synthesizing response...'} />
                      )}
                    </div>

                    {/* Bot Message Action Toolbar */}
                    {!isUser && msg.content && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-1 px-1 text-slate-400 text-xs">
                          {/* Copy */}
                          <button
                            onClick={() => handleCopy(msg.id, msg.content)}
                            className="p-1.5 rounded-lg hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="Copy answer"
                          >
                            {copiedId === msg.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>

                          {/* Read Aloud */}
                          {isSpeechSynthesisSupported() && (
                            <button
                              onClick={() => handleToggleSpeak(msg.id, msg.content)}
                              className="p-1.5 rounded-lg hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                              title={speakingId === msg.id ? 'Stop audio' : 'Read aloud'}
                            >
                              {speakingId === msg.id ? (
                                <VolumeX className="w-3.5 h-3.5 text-rose-500" />
                              ) : (
                                <Volume2 className="w-3.5 h-3.5" />
                              )}
                            </button>
                          )}

                          {/* Save to Notes */}
                          <button
                            onClick={() => handleSaveToNotes(msg)}
                            className="p-1.5 rounded-lg hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="Save to Study Notes"
                          >
                            <Bookmark className="w-3.5 h-3.5" />
                          </button>

                          {/* Regenerate */}
                          <button
                            onClick={() => handleRegenerate(index)}
                            className="p-1.5 rounded-lg hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="Regenerate answer"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>

                          <div className="h-3 w-px bg-slate-200 dark:bg-slate-700 mx-1" />

                          {/* Thumbs Up / Down */}
                          <button
                            onClick={() => handleFeedback(msg.id, 'like')}
                            className={`p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${
                              msg.feedback === 'like' ? 'text-emerald-500 font-bold' : 'hover:text-slate-700'
                            }`}
                            title="Helpful"
                          >
                            <ThumbsUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleFeedback(msg.id, 'dislike')}
                            className={`p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${
                              msg.feedback === 'dislike' ? 'text-rose-500 font-bold' : 'hover:text-slate-700'
                            }`}
                            title="Needs improvement"
                          >
                            <ThumbsDown className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Section 10: AI Response Actions Chips */}
                        {isLastBotMsg && !isStreaming && (
                          <div className="pt-1">
                            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1">
                              <Sparkles className="w-3 h-3 text-blue-500" />
                              <span>Explore Next:</span>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              <button
                                onClick={() => handleContextAction('simpler', index)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                              >
                                <Lightbulb className="w-3 h-3 text-amber-500" />
                                <span>Explain Simpler</span>
                              </button>
                              <button
                                onClick={() => handleContextAction('example', index)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                              >
                                <BookOpen className="w-3 h-3 text-emerald-500" />
                                <span>Give Example</span>
                              </button>
                              <button
                                onClick={() => handleContextAction('quiz', index)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                              >
                                <GraduationCap className="w-3 h-3 text-indigo-500" />
                                <span>Quiz Me</span>
                              </button>
                              <button
                                onClick={() => handleContextAction('flashcards', index)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                              >
                                <Layers className="w-3 h-3 text-purple-500" />
                                <span>Create Flashcards</span>
                              </button>
                              <button
                                onClick={() => handleContextAction('summarize', index)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                              >
                                <FileText className="w-3 h-3 text-blue-500" />
                                <span>Summarize</span>
                              </button>
                              <button
                                onClick={() => handleContextAction('deeper', index)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                              >
                                <ArrowDownCircle className="w-3 h-3 text-rose-500" />
                                <span>Go Deeper</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {isUser && (
                    <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 shrink-0 mt-0.5">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3 sm:p-4 border-t border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900">
          {speechError && (
            <div className="mb-2 px-3 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs">
              {speechError}
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(inputMessage);
            }}
            className="flex items-end gap-2 p-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-2xl shadow-inner focus-within:border-blue-500 dark:focus-within:border-blue-500 transition-all"
          >
            <button
              type="button"
              onClick={toggleVoiceInput}
              className={`p-2.5 rounded-xl transition-all cursor-pointer ${
                isListening
                  ? 'bg-rose-500 text-white animate-pulse'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700'
              }`}
              title={
                isListening
                  ? 'Listening... Click to stop'
                  : isSpeechRecognitionSupported()
                  ? 'Voice input (Speech to text)'
                  : 'Speech recognition not supported in this browser'
              }
            >
              <Mic className="w-4 h-4" />
            </button>

            <textarea
              ref={inputRef}
              rows={1}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(inputMessage);
                }
              }}
              placeholder={
                pinnedDocument
                  ? `Ask about ${pinnedDocument.fileName}...`
                  : `Ask StudyPilot in ${mode.toUpperCase()} mode...`
              }
              className="flex-1 max-h-32 bg-transparent text-sm sm:text-base border-none outline-hidden resize-none py-1.5 text-slate-900 dark:text-white placeholder:text-slate-400 leading-normal"
            />

            <button
              type="submit"
              disabled={!inputMessage.trim() || isStreaming}
              className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:hover:bg-blue-600 text-white transition-colors cursor-pointer shrink-0"
              title="Send question"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 px-1">
            <span>Shift + Enter for new line • Markdown & KaTeX supported</span>
            <span className="hidden sm:inline">Active Mode: <strong>{mode.toUpperCase()}</strong> ({difficulty})</span>
          </div>
        </div>
      </div>
    </div>
  );
};
