import React, { useState, useRef, useEffect } from 'react';
import { useStudy } from '../../context/StudyContext';
import { ChatMessage, StudyMaterial, ChatThread } from '../../types';
import {
  Bot,
  User,
  Send,
  Sparkles,
  FileText,
  RotateCcw,
  BookOpen,
  HelpCircle,
  Layers,
  ChevronDown,
  Copy,
  Check,
  Zap,
  GraduationCap,
  Lightbulb,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Cloud,
  History,
  Plus,
  Mic,
  Square,
  Volume2,
  VolumeX,
  Volume1,
  Camera,
  Image as ImageIcon,
  X as CloseIcon,
  Brain,
  Scale,
  Play,
  Pause,
  Headphones,
  SlidersHorizontal,
  Radio,
  Settings2,
  Maximize2,
  Eye,
  Sigma
} from 'lucide-react';
import { VisionCaptureModal, VisionImagePayload } from './VisionCaptureModal';
import { loginWithGoogle } from '../../lib/firebase';

// Added SpeechRecognition polyfill
const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

export const AITutorView: React.FC = () => {
  const {
    user,
    isSyncing,
    isRealtimeActive,
    lastRealtimeSync,
    syncToFirestore,
    subjects,
    selectedSubjectId,
    materials,
    selectedMaterialForAction,
    setSelectedMaterialForAction,
    addFlashcards,
    setActiveTab,
    addQuiz,
    chatThreads,
    saveChatThread
  } = useStudy();

  const currentSubject = subjects.find(s => s.id === selectedSubjectId) || subjects[0];
  const subjectMaterials = materials.filter(m => !selectedSubjectId || m.subjectId === selectedSubjectId);

  // Selected grounding material
  const [groundingMaterial, setGroundingMaterial] = useState<StudyMaterial | null>(() => {
    return selectedMaterialForAction || subjectMaterials[0] || null;
  });

  const [tutorMode, setTutorMode] = useState<'simple' | 'exam' | 'deep' | 'revision' | 'feynman' | 'debate'>('simple');
  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeThreadId, setActiveThreadId] = useState<string>(() => 'thread_' + Date.now());
  const [showThreadHistory, setShowThreadHistory] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const [isPausedSpeech, setIsPausedSpeech] = useState(false);
  const [speechRate, setSpeechRate] = useState<number>(1.0);
  const [speechPitch, setSpeechPitch] = useState<number>(1.0);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState<string>('');
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);
  const [isHandsFreeMode, setIsHandsFreeMode] = useState(false);
  const [speechProgress, setSpeechProgress] = useState<{ current: number; total: number; text: string }>({
    current: 0,
    total: 0,
    text: ''
  });
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isVisionModalOpen, setIsVisionModalOpen] = useState(false);
  const [attachedVisionImage, setAttachedVisionImage] = useState<VisionImagePayload | null>(null);
  const [zoomImage, setZoomImage] = useState<{ url: string; title: string; category?: string } | null>(null);
  const [showSyncInfoModal, setShowSyncInfoModal] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const silenceTimerRef = useRef<any>(null);
  const utteranceQueueRef = useRef<string[]>([]);
  const currentChunkIndexRef = useRef<number>(0);
  const activeSpeakingMsgIdRef = useRef<string | null>(null);
  const isHandsFreeRef = useRef<boolean>(false);
  const isAudioEnabledRef = useRef<boolean>(true);
  const speechRateRef = useRef<number>(1.0);
  const speechPitchRef = useRef<number>(1.0);
  const selectedVoiceURIRef = useRef<string>('');

  useEffect(() => {
    isHandsFreeRef.current = isHandsFreeMode;
  }, [isHandsFreeMode]);

  useEffect(() => {
    isAudioEnabledRef.current = isAudioEnabled;
  }, [isAudioEnabled]);

  useEffect(() => {
    speechRateRef.current = speechRate;
  }, [speechRate]);

  useEffect(() => {
    speechPitchRef.current = speechPitch;
  }, [speechPitch]);

  useEffect(() => {
    selectedVoiceURIRef.current = selectedVoiceURI;
  }, [selectedVoiceURI]);

  // Load and manage browser speech synthesis voices
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    const populateVoices = () => {
      const allVoices = window.speechSynthesis.getVoices();
      if (!allVoices || allVoices.length === 0) return;

      const englishVoices = allVoices.filter(v => v.lang.startsWith('en'));
      const voicesToUse = englishVoices.length > 0 ? englishVoices : allVoices;
      setAvailableVoices(voicesToUse);

      // Auto-select preferred natural voice if not already picked
      if (!selectedVoiceURIRef.current) {
        const preferred = voicesToUse.find(v =>
          v.name.includes('Natural') ||
          v.name.includes('Google') ||
          v.name.includes('Samantha') ||
          v.name.includes('Daniel') ||
          v.name.includes('Alex') ||
          v.name.includes('Karen') ||
          v.name.includes('Arthur')
        ) || voicesToUse[0];

        if (preferred) {
          setSelectedVoiceURI(preferred.voiceURI);
          selectedVoiceURIRef.current = preferred.voiceURI;
        }
      }
    };

    populateVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = populateVoices;
    }

    return () => {
      stopSpeaking();
    };
  }, []);

  // Clean Markdown and technical markup so speech synthesis sounds natural
  const cleanTextForSpeech = (raw: string): string => {
    return raw
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/#{1,6}\s+/g, '')
      .replace(/```[\s\S]*?```/g, 'Code or formula snippet.')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/---/g, '')
      .replace(/^\s*[-*+]\s+/gm, '')
      .replace(/^\s*\d+\.\s+/gm, '')
      .replace(/\\rightarrow/g, 'leads to')
      .replace(/\\Delta/g, 'delta')
      .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '$1 over $2')
      .replace(/\$([^$]+)\$/g, '$1')
      .trim();
  };

  // Chunk text into sentence-sized blocks to prevent browser TTS stalls
  const chunkTextForSpeech = (text: string): string[] => {
    const rawSentences = text
      .split(/(?<=[.?!;:\n])\s+/)
      .map(s => s.trim())
      .filter(s => s.length > 0);

    const chunks: string[] = [];
    let current = '';
    for (const sent of rawSentences) {
      if ((current + ' ' + sent).length > 170) {
        if (current) chunks.push(current);
        current = sent;
      } else {
        current = current ? current + ' ' + sent : sent;
      }
    }
    if (current) chunks.push(current);
    return chunks.length > 0 ? chunks : [text];
  };

  const speakNextChunk = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const queue = utteranceQueueRef.current;
    const idx = currentChunkIndexRef.current;
    const msgId = activeSpeakingMsgIdRef.current;

    if (idx >= queue.length || !msgId) {
      // Finished speaking all chunks
      setSpeakingMsgId(null);
      setIsPausedSpeech(false);
      activeSpeakingMsgIdRef.current = null;
      setSpeechProgress({ current: 0, total: 0, text: '' });

      // If in hands-free continuous dialogue mode, start listening for student response!
      if (isHandsFreeRef.current) {
        setTimeout(() => {
          startSpeechRecognition();
        }, 500);
      }
      return;
    }

    const chunk = queue[idx];
    setSpeechProgress({ current: idx + 1, total: queue.length, text: chunk });

    const utterance = new SpeechSynthesisUtterance(chunk);
    utterance.rate = speechRateRef.current;
    utterance.pitch = speechPitchRef.current;

    const voices = window.speechSynthesis.getVoices();
    const chosenVoice = voices.find(v => v.voiceURI === selectedVoiceURIRef.current) ||
      voices.find(v => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha')));
    if (chosenVoice) {
      utterance.voice = chosenVoice;
    }

    utterance.onend = () => {
      currentChunkIndexRef.current += 1;
      speakNextChunk();
    };

    utterance.onerror = (e) => {
      console.warn('Speech synthesis utterance error', e);
      currentChunkIndexRef.current += 1;
      speakNextChunk();
    };

    window.speechSynthesis.speak(utterance);
  };

  const speak = (text: string, msgId: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    const cleaned = cleanTextForSpeech(text);
    if (!cleaned) return;

    const chunks = chunkTextForSpeech(cleaned);
    utteranceQueueRef.current = chunks;
    currentChunkIndexRef.current = 0;
    activeSpeakingMsgIdRef.current = msgId;

    setSpeakingMsgId(msgId);
    setIsPausedSpeech(false);

    speakNextChunk();
  };

  const pauseSpeech = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.pause();
      setIsPausedSpeech(true);
    }
  };

  const resumeSpeech = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.resume();
      setIsPausedSpeech(false);
    }
  };

  const stopSpeaking = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    utteranceQueueRef.current = [];
    currentChunkIndexRef.current = 0;
    activeSpeakingMsgIdRef.current = null;
    setSpeakingMsgId(null);
    setIsPausedSpeech(false);
    setSpeechProgress({ current: 0, total: 0, text: '' });
  };

  const testVoiceSample = () => {
    speak("Hello! I am your StudyMate AI Tutor. I'm ready to explain concepts, guide step-by-step derivations, and test your exam recall.", 'test_sample');
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64Prefix = 'base64,';
      const base64Index = result.indexOf(base64Prefix);
      const data = base64Index !== -1 ? result.substring(base64Index + base64Prefix.length) : result;

      setAttachedVisionImage({
        data,
        dataUrl: result,
        mimeType: file.type || 'image/jpeg',
        name: file.name,
        category: 'diagram'
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Initial welcome message factory
  const getWelcomeMessage = (): ChatMessage => ({
    id: 'msg_welcome',
    role: 'assistant',
    content: `Hello! I am your personal AI Study Tutor for **${currentSubject?.name || 'College Subjects'}**.

I learn directly from your uploaded lecture notes and slide decks to help you master concepts through an interactive, multi-turn dialogue.

How would you like to begin today? Select your preferred mode above or try one of the suggestions below!`,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    mode: 'simple',
    sourceMaterialName: groundingMaterial?.originalName,
    suggestedFollowUps: groundingMaterial ? [
      `Summarize the key takeaways from ${groundingMaterial.originalName}`,
      'Explain this concept like I am 10 years old.',
      'Give me an exam-level breakdown of the key formulas.',
      'What are the most frequent student misconceptions?'
    ] : [
      'Explain the fundamental principles of this subject.',
      'Break down the most challenging concepts step-by-step.',
      'Give me an exam-level practice question.',
      'What are the most common student pitfalls?'
    ],
    canQuizMe: true,
    canCreateFlashcard: true
  });

  // Conversation history
  const [messages, setMessages] = useState<ChatMessage[]>([getWelcomeMessage()]);

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // If selectedMaterialForAction changed from external click
  useEffect(() => {
    if (selectedMaterialForAction) {
      setGroundingMaterial(selectedMaterialForAction);
    }
  }, [selectedMaterialForAction]);

  // Save current thread to context whenever messages change (after user sent first turn)
  useEffect(() => {
    if (messages.length > 1) {
      const firstUserMsg = messages.find(m => m.role === 'user');
      const threadTitle = firstUserMsg
        ? (firstUserMsg.content.slice(0, 35) + (firstUserMsg.content.length > 35 ? '...' : ''))
        : `Session: ${currentSubject?.name || 'Tutor'}`;

      const thread: ChatThread = {
        id: activeThreadId,
        title: threadTitle,
        subjectId: currentSubject?.id,
        materialId: groundingMaterial?.id,
        mode: tutorMode,
        messages,
        createdAt: messages[0]?.timestamp || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      saveChatThread(thread);
    }
  }, [messages, activeThreadId, tutorMode, currentSubject?.id, currentSubject?.name, groundingMaterial?.id, saveChatThread]);

  const handleStartNewThread = () => {
    const newId = 'thread_' + Date.now();
    setActiveThreadId(newId);
    setMessages([getWelcomeMessage()]);
    setInputQuery('');
    setShowThreadHistory(false);
  };

  const handleSelectThread = (thread: ChatThread) => {
    setActiveThreadId(thread.id);
    setMessages(thread.messages);
    setTutorMode(thread.mode || 'simple');
    if (thread.materialId) {
      const mat = materials.find(m => m.id === thread.materialId);
      if (mat) setGroundingMaterial(mat);
    }
    setShowThreadHistory(false);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputQuery).trim();
    if ((!query && !attachedVisionImage) || isLoading) return;

    if (isRecording) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsRecording(false);
    }

    const imageToSend = attachedVisionImage;
    setAttachedVisionImage(null);

    let defaultPrompt = 'Please analyze this diagram and explain it step-by-step.';
    if (imageToSend?.category === 'formula') {
      defaultPrompt = 'Please extract this formula, verify its mathematical syntax, and show step-by-step derivation or application.';
    } else if (imageToSend?.category === 'handwritten') {
      defaultPrompt = 'Please transcribe these handwritten study notes and explain all core concepts clearly.';
    }

    const userMsg: ChatMessage = {
      id: 'msg_' + Date.now(),
      role: 'user',
      content: query || defaultPrompt,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      imageDataUrl: imageToSend?.dataUrl,
      visionCategory: imageToSend?.category
    };

    const nextHistory = [...messages, userMsg];
    setMessages(nextHistory);
    setInputQuery('');
    setIsLoading(true);

    try {
      const resp = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: nextHistory.map(m => ({ role: m.role, content: m.content })),
          mode: tutorMode,
          studyMaterialText: groundingMaterial?.extractedText || '',
          materialName: groundingMaterial?.originalName || '',
          subjectName: currentSubject?.name || '',
          imageInlineData: imageToSend ? { data: imageToSend.data, mimeType: imageToSend.mimeType } : undefined,
          visionCategory: imageToSend?.category
        })
      });

      if (!resp.ok) {
        throw new Error('AI Tutor server error');
      }

      const data = await resp.json();
      const reply = data.reply || 'I am ready to continue helping you.';
      const followUps = Array.isArray(data.suggestedFollowUps) && data.suggestedFollowUps.length > 0
        ? data.suggestedFollowUps
        : [
            'Explain simpler with an everyday analogy',
            'Give me a concrete step-by-step calculation example',
            'Quiz me on this concept to test my recall',
            'What are common exam traps for this topic?'
          ];

      const assistantMsg: ChatMessage = {
        id: 'msg_ai_' + Date.now(),
        role: 'assistant',
        content: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        mode: tutorMode,
        sourceMaterialName: groundingMaterial?.originalName,
        canQuizMe: true,
        canCreateFlashcard: true,
        suggestedFollowUps: followUps
      };

      setMessages(prev => [...prev, assistantMsg]);

      // Trigger automatic audio playback if Voice Audio is enabled
      if (isAudioEnabled) {
        speak(reply, assistantMsg.id);
      }
    } catch (err: any) {
      console.error('Chat error:', err);
      const errorMsg: ChatMessage = {
        id: 'msg_err_' + Date.now(),
        role: 'assistant',
        content: 'I encountered an issue connecting with Gemini. Please try asking again or change your phrasing.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  // Quick Action: Create Flashcard from message
  const handleCreateFlashcardFromMessage = (content: string) => {
    const firstLine = content.split('\n')[0].replace(/[#*]/g, '').trim() || 'Core Concept';
    const explanation = content.slice(0, 300).trim();

    addFlashcards([
      {
        subjectId: selectedSubjectId || 'subj_ai',
        topic: currentSubject?.topics[0] || 'AI Foundations',
        front: `What is the key insight regarding: ${firstLine}?`,
        back: explanation,
        difficulty: 'medium',
        status: 'new',
        reviewCount: 0
      }
    ]);
  };

  const startSpeechRecognition = () => {
    if (!SpeechRecognition) {
      alert("Your browser does not support the Web Speech API. Please try Chrome, Edge, or Safari.");
      return;
    }

    // Stop speaking if AI is talking
    stopSpeaking();

    try {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch (e) {}
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        let currentInterim = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            currentInterim += event.results[i][0].transcript;
          }
        }

        setInterimTranscript(currentInterim);

        if (finalTranscript) {
          setInputQuery(prev => (prev ? prev + ' ' + finalTranscript : finalTranscript).trim());
          setInterimTranscript('');

          // In hands-free conversational mode, automatically submit after 1.8s of silence
          if (isHandsFreeRef.current) {
            if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = setTimeout(() => {
              try { recognition.stop(); } catch (e) {}
              setIsRecording(false);
              setInterimTranscript('');
              handleSendMessage();
            }, 1800);
          }
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition status:', event.error);
        if (event.error !== 'no-speech') {
          setIsRecording(false);
          setInterimTranscript('');
        }
      };

      recognition.onend = () => {
        setIsRecording(false);
        setInterimTranscript('');
      };

      recognitionRef.current = recognition;
      recognition.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Failed to start speech recognition', err);
      setIsRecording(false);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
      setIsRecording(false);
      setInterimTranscript('');
      return;
    }

    startSpeechRecognition();
  };

  const userTurnCount = messages.filter(m => m.role === 'user').length;

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-5xl mx-auto bg-white rounded-2xl border border-neutral-200 shadow-2xs overflow-hidden">
      {/* Top Header Bar with Multi-Turn Controls & Cloud Status */}
      <div className="p-4 border-b border-neutral-200 bg-neutral-50 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-neutral-950 flex items-center justify-center text-white shadow-xs">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-neutral-950">AI Study Tutor</h2>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-neutral-200 text-neutral-800">
                Multi-Turn {userTurnCount > 0 ? `(Turn ${userTurnCount})` : 'Active'}
              </span>
              {/* Firestore Real-Time Sync Indicator */}
              <button
                type="button"
                onClick={() => setShowSyncInfoModal(true)}
                className="text-[10px] font-semibold flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border bg-emerald-500/10 border-emerald-500/30 text-emerald-950 hover:bg-emerald-500/20 transition-all cursor-pointer shadow-2xs"
                title="Click to inspect Firestore Live Real-Time Sync details"
              >
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                </span>
                <span>{isSyncing ? 'Syncing...' : user ? 'Firestore Live Sync' : 'Real-Time Sync Active'}</span>
              </button>
            </div>
            <p className="text-xs text-neutral-500">
              Contextual guidance for <span className="font-semibold text-neutral-800">{currentSubject?.name}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Thread History dropdown */}
          {chatThreads.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setShowThreadHistory(!showThreadHistory)}
                className="px-2.5 py-1.5 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-100 text-neutral-800 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                title="Saved Multi-Turn Sessions"
              >
                <History className="w-3.5 h-3.5 text-neutral-500" />
                <span>History ({chatThreads.length})</span>
                <ChevronDown className="w-3 h-3 text-neutral-400" />
              </button>

              {showThreadHistory && (
                <div className="absolute right-0 mt-1 w-64 bg-white border border-neutral-200 rounded-xl shadow-lg z-30 p-1.5 space-y-1">
                  <div className="text-[11px] font-bold text-neutral-400 px-2 py-1 uppercase tracking-wider">
                    Recent Conversations
                  </div>
                  {chatThreads.map(t => (
                    <button
                      key={t.id}
                      onClick={() => handleSelectThread(t)}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs truncate transition-colors flex items-center justify-between ${
                        t.id === activeThreadId
                          ? 'bg-neutral-100 text-neutral-950 font-bold'
                          : 'text-neutral-700 hover:bg-neutral-50'
                      }`}
                    >
                      <span className="truncate">{t.title}</span>
                      <span className="text-[10px] text-neutral-400 shrink-0 ml-2">
                        {t.messages.length} msgs
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* New Chat Button */}
          <button
            onClick={handleStartNewThread}
            className="px-2.5 py-1.5 rounded-lg bg-neutral-950 hover:bg-black text-white text-xs font-semibold flex items-center gap-1 transition-colors"
            title="Start a new multi-turn tutor session"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Chat</span>
          </button>
        </div>
      </div>

      {/* Mode Switcher & Grounding Material Selector */}
      <div className="px-4 py-2.5 border-b border-neutral-200 bg-white flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Tutor Modes */}
        <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-xl overflow-x-auto max-w-full">
          <button
            onClick={() => setTutorMode('simple')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all shrink-0 ${
              tutorMode === 'simple'
                ? 'bg-white text-neutral-950 font-bold shadow-2xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            Simple
          </button>
          <button
            onClick={() => setTutorMode('exam')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all shrink-0 ${
              tutorMode === 'exam'
                ? 'bg-white text-neutral-950 font-bold shadow-2xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            Exam Ready
          </button>
          <button
            onClick={() => setTutorMode('deep')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all shrink-0 ${
              tutorMode === 'deep'
                ? 'bg-white text-neutral-950 font-bold shadow-2xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            Deep Dive
          </button>
          <button
            onClick={() => setTutorMode('revision')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all shrink-0 ${
              tutorMode === 'revision'
                ? 'bg-white text-neutral-950 font-bold shadow-2xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            Revision
          </button>
          <button
            onClick={() => setTutorMode('feynman')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all shrink-0 flex items-center gap-1 ${
              tutorMode === 'feynman'
                ? 'bg-amber-100 text-amber-950 font-bold shadow-2xs border border-amber-300'
                : 'text-neutral-600 hover:text-amber-800'
            }`}
            title="Feynman Simulator: Explain like to a beginner, AI detects jargon & logical gaps"
          >
            <Brain className="w-3 h-3 text-amber-600" />
            <span>Feynman Simulator</span>
          </button>
          <button
            onClick={() => setTutorMode('debate')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all shrink-0 flex items-center gap-1 ${
              tutorMode === 'debate'
                ? 'bg-purple-100 text-purple-950 font-bold shadow-2xs border border-purple-300'
                : 'text-neutral-600 hover:text-purple-800'
            }`}
            title="AI Debate Partner: Tests counter-arguments and defense"
          >
            <Scale className="w-3 h-3 text-purple-600" />
            <span>Debate Partner</span>
          </button>
        </div>

        {/* Right side: Audio Voice Toggle, Hands-Free, Settings & Grounding Source */}
        <div className="flex items-center gap-2">
          {/* Hands-Free Conversational Voice Loop Toggle */}
          <button
            type="button"
            onClick={() => {
              const next = !isHandsFreeMode;
              setIsHandsFreeMode(next);
              if (next) {
                setIsAudioEnabled(true);
                startSpeechRecognition();
              } else {
                if (isRecording) toggleRecording();
              }
            }}
            className={`px-2.5 py-1 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              isHandsFreeMode
                ? 'bg-neutral-950 text-white border-neutral-950 shadow-xs'
                : 'bg-neutral-50 text-neutral-700 border-neutral-200 hover:bg-neutral-100'
            }`}
            title={isHandsFreeMode ? "Continuous Two-Way Voice Dialogue (listens after speaking)" : "Enable hands-free continuous dialogue"}
          >
            <Headphones className={`w-3.5 h-3.5 ${isHandsFreeMode ? 'text-emerald-400 animate-pulse' : 'text-neutral-500'}`} />
            <span className="hidden sm:inline">{isHandsFreeMode ? 'Live Dialogue: ON' : 'Hands-Free'}</span>
            <span className="sm:hidden">{isHandsFreeMode ? 'Live: ON' : 'Hands-Free'}</span>
          </button>

          {/* AI Voice Toggle */}
          <button
            type="button"
            onClick={() => {
              const next = !isAudioEnabled;
              setIsAudioEnabled(next);
              if (!next) {
                stopSpeaking();
                setIsHandsFreeMode(false);
              }
            }}
            className={`px-2.5 py-1 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              isAudioEnabled
                ? 'bg-neutral-900 text-white border-neutral-900 shadow-2xs'
                : 'bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-neutral-100'
            }`}
            title={isAudioEnabled ? "AI Voice is ON (reads replies aloud)" : "Enable AI Voice playback"}
          >
            {isAudioEnabled ? (
              <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <VolumeX className="w-3.5 h-3.5 text-neutral-400" />
            )}
            <span>{isAudioEnabled ? `Voice: ${speechRate}x` : 'Voice: OFF'}</span>
          </button>

          {/* Voice Settings Popover Trigger */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowVoiceSettings(!showVoiceSettings)}
              className={`p-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                showVoiceSettings
                  ? 'bg-neutral-200 border-neutral-300 text-neutral-900'
                  : 'bg-neutral-50 border-neutral-200 hover:bg-neutral-100 text-neutral-700'
              }`}
              title="Voice & Speech Settings"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
            </button>

            {/* Voice Settings Dropdown */}
            {showVoiceSettings && (
              <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white border border-neutral-200 rounded-2xl shadow-xl z-50 p-4 space-y-4 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-neutral-900">
                    <Volume2 className="w-4 h-4 text-neutral-900" />
                    <span>AI Voice & Speech Settings</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowVoiceSettings(false)}
                    className="text-neutral-400 hover:text-neutral-800 p-0.5 rounded-md"
                  >
                    <CloseIcon className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Voice Picker */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-neutral-600 uppercase tracking-wider block">
                    AI Tutor Voice
                  </label>
                  <select
                    value={selectedVoiceURI}
                    onChange={(e) => {
                      setSelectedVoiceURI(e.target.value);
                      selectedVoiceURIRef.current = e.target.value;
                    }}
                    className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-neutral-300 bg-white text-neutral-900 font-medium focus:ring-1 focus:ring-neutral-950 focus:outline-hidden truncate"
                  >
                    {availableVoices.length > 0 ? (
                      availableVoices.map((v) => (
                        <option key={v.voiceURI} value={v.voiceURI}>
                          {v.name} ({v.lang})
                        </option>
                      ))
                    ) : (
                      <option value="">Default System Voice</option>
                    )}
                  </select>
                </div>

                {/* Speech Speed */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px] font-bold text-neutral-600">
                    <span>Speech Speed</span>
                    <span className="text-neutral-900 font-bold">{speechRate}x</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[0.8, 1.0, 1.25, 1.5].map((rate) => (
                      <button
                        key={rate}
                        type="button"
                        onClick={() => setSpeechRate(rate)}
                        className={`py-1 rounded-md text-xs font-semibold border transition-all ${
                          speechRate === rate
                            ? 'bg-neutral-950 text-white border-neutral-950'
                            : 'bg-neutral-50 text-neutral-700 border-neutral-200 hover:bg-neutral-100'
                        }`}
                      >
                        {rate}x
                      </button>
                    ))}
                  </div>
                </div>

                {/* Hands-Free Continuous Loop Switch */}
                <div className="pt-2 border-t border-neutral-100 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-neutral-900">Hands-Free Dialogue Loop</p>
                    <p className="text-[10px] text-neutral-500">Auto-listen when AI finishes speaking</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const next = !isHandsFreeMode;
                      setIsHandsFreeMode(next);
                      if (next) setIsAudioEnabled(true);
                    }}
                    className={`w-10 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${
                      isHandsFreeMode ? 'bg-neutral-950' : 'bg-neutral-300'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                      isHandsFreeMode ? 'translate-x-5' : 'translate-x-0'
                    }`} />
                  </button>
                </div>

                {/* Preview Voice Sample */}
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={testVoiceSample}
                    className="w-full py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-900 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Volume1 className="w-4 h-4 text-neutral-700" />
                    <span>Test AI Voice Sample</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-neutral-500 font-medium flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5 text-neutral-700" />
            </span>
            <select
              value={groundingMaterial?.id || ''}
              onChange={(e) => {
                const selected = materials.find(m => m.id === e.target.value) || null;
                setGroundingMaterial(selected);
                if (selected) setSelectedMaterialForAction(selected);
              }}
              className="px-2.5 py-1 rounded-lg bg-neutral-50 border border-neutral-200 text-neutral-800 font-medium text-xs focus:ring-1 focus:ring-neutral-900 focus:outline-hidden max-w-[170px] truncate"
            >
              <option value="">General Knowledge</option>
              {materials.map(m => (
                <option key={m.id} value={m.id}>
                  📄 {m.originalName}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Mode-Specific Guidance Callouts */}
      {tutorMode === 'feynman' && (
        <div className="px-4 py-2 bg-amber-50 border-b border-amber-200/70 flex items-center justify-between text-xs text-amber-900">
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Feynman Simulator Active:</strong> Explain this concept simply as if to a 10-year-old. The AI will challenge your technical jargon, spot missing logical connections, and push for everyday analogies!
            </span>
          </div>
          <span className="text-[10px] bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded-full font-bold uppercase shrink-0 ml-2">
            Active Recall
          </span>
        </div>
      )}

      {tutorMode === 'debate' && (
        <div className="px-4 py-2 bg-purple-50 border-b border-purple-200/70 flex items-center justify-between text-xs text-purple-900">
          <div className="flex items-center gap-2">
            <Scale className="w-4 h-4 text-purple-600 shrink-0" />
            <span>
              <strong>AI Debate Partner Active:</strong> State an assertion, theorem, or design choice. The AI will play devil's advocate and probe edge cases to prepare you for oral exams and defenses!
            </span>
          </div>
          <span className="text-[10px] bg-purple-200/80 text-purple-900 px-2 py-0.5 rounded-full font-bold uppercase shrink-0 ml-2">
            Defense Prep
          </span>
        </div>
      )}

      {/* Grounding Status Notice */}
      {groundingMaterial && (
        <div className="px-4 py-1.5 bg-neutral-100 border-b border-neutral-200 flex items-center justify-between text-xs text-neutral-800">
          <div className="flex items-center gap-1.5 truncate">
            <ShieldCheck className="w-4 h-4 text-neutral-800 shrink-0" />
            <span className="truncate">
              Grounded in: <strong>{groundingMaterial.originalName}</strong>
            </span>
          </div>
          <span className="text-[10px] text-neutral-800 font-semibold bg-white px-2 py-0.5 rounded border border-neutral-200 shrink-0">
            Material Grounded
          </span>
        </div>
      )}

      {/* Floating Active Voice Bar when AI is reading response aloud */}
      {speakingMsgId && (
        <div className="px-4 py-2.5 bg-neutral-950 text-white border-b border-neutral-800 flex flex-wrap items-center justify-between gap-3 text-xs shadow-md animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Waveform Equalizer Animation */}
            <div className="flex items-center gap-0.5 h-4 px-1 shrink-0">
              <span className="w-1 bg-emerald-400 rounded-full animate-[bounce_0.8s_infinite_100ms] h-3.5" />
              <span className="w-1 bg-emerald-400 rounded-full animate-[bounce_0.8s_infinite_300ms] h-2.5" />
              <span className="w-1 bg-emerald-400 rounded-full animate-[bounce_0.8s_infinite_200ms] h-4" />
              <span className="w-1 bg-emerald-400 rounded-full animate-[bounce_0.8s_infinite_400ms] h-2" />
              <span className="w-1 bg-emerald-400 rounded-full animate-[bounce_0.8s_infinite_150ms] h-3" />
            </div>
            <div className="min-w-0 truncate">
              <div className="font-bold text-white flex items-center gap-1.5">
                <span>AI Tutor Speaking</span>
                {speechProgress.total > 1 && (
                  <span className="text-[10px] text-neutral-400 font-normal">
                    (Part {speechProgress.current} of {speechProgress.total})
                  </span>
                )}
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-neutral-800 text-emerald-400 font-semibold">
                  {speechRate}x
                </span>
              </div>
              {speechProgress.text && (
                <p className="text-[11px] text-neutral-300 truncate max-w-xs sm:max-w-md italic">
                  "{speechProgress.text}"
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Pause / Resume */}
            <button
              type="button"
              onClick={isPausedSpeech ? resumeSpeech : pauseSpeech}
              className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white font-semibold flex items-center gap-1 text-xs transition-colors cursor-pointer"
              title={isPausedSpeech ? "Resume playback" : "Pause speech"}
            >
              {isPausedSpeech ? <Play className="w-3.5 h-3.5 fill-current" /> : <Pause className="w-3.5 h-3.5" />}
              <span>{isPausedSpeech ? 'Resume' : 'Pause'}</span>
            </button>

            {/* Speed Selector */}
            <div className="hidden sm:flex items-center gap-1 bg-neutral-800 p-0.5 rounded-lg">
              {[1.0, 1.25, 1.5].map((rate) => (
                <button
                  key={rate}
                  type="button"
                  onClick={() => setSpeechRate(rate)}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                    speechRate === rate ? 'bg-white text-neutral-950' : 'text-neutral-300 hover:text-white'
                  }`}
                >
                  {rate}x
                </button>
              ))}
            </div>

            {/* Stop Speech */}
            <button
              type="button"
              onClick={stopSpeaking}
              className="px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold flex items-center gap-1 text-xs transition-colors cursor-pointer"
              title="Stop speaking"
            >
              <Square className="w-3 h-3 fill-current" />
              <span>Stop</span>
            </button>

            {/* Interrupt & Speak Student Follow-up */}
            <button
              type="button"
              onClick={() => {
                stopSpeaking();
                startSpeechRecognition();
              }}
              className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-neutral-950 font-bold flex items-center gap-1 text-xs transition-colors cursor-pointer"
              title="Interrupt AI and speak your question"
            >
              <Mic className="w-3.5 h-3.5" />
              <span>Interrupt & Speak</span>
            </button>
          </div>
        </div>
      )}

      {/* Active Speech Recognition Banner when listening */}
      {isRecording && (
        <div className="px-4 py-2 bg-red-50 border-b border-red-200 flex items-center justify-between text-xs text-red-900 animate-in fade-in duration-150">
          <div className="flex items-center gap-2 truncate">
            <div className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping shrink-0" />
            <span className="font-semibold shrink-0">Listening:</span>
            <span className="truncate italic text-red-800">
              {interimTranscript || inputQuery || "Speak now (in hands-free mode, auto-submits on silence)..."}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-2">
            <button
              type="button"
              onClick={() => {
                if (recognitionRef.current) {
                  try { recognitionRef.current.stop(); } catch (e) {}
                }
                setIsRecording(false);
                setInterimTranscript('');
                handleSendMessage();
              }}
              disabled={!inputQuery.trim() && !interimTranscript.trim()}
              className="px-2.5 py-1 rounded-md bg-red-600 hover:bg-red-700 text-white font-semibold text-[11px] disabled:opacity-40 transition-colors cursor-pointer"
            >
              Send Now
            </button>
            <button
              type="button"
              onClick={toggleRecording}
              className="px-2 py-1 rounded-md border border-red-300 text-red-700 hover:bg-red-100 text-[11px] cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Messages Thread */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
        {messages.map((msg) => {
          const isAi = msg.role === 'assistant';

          return (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-3xl ${isAi ? 'mr-auto' : 'ml-auto flex-row-reverse'}`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                  isAi ? 'bg-neutral-950 text-white shadow-xs' : 'bg-neutral-700 text-white'
                }`}
              >
                {isAi ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
              </div>

              {/* Message Bubble */}
              <div className="space-y-2 flex-1">
                <div
                  className={`p-4 rounded-2xl text-sm leading-relaxed ${
                    isAi
                      ? 'bg-neutral-50 border border-neutral-200 text-neutral-900 shadow-2xs'
                      : 'bg-neutral-950 text-white shadow-xs'
                  }`}
                >
                  {/* Uploaded Diagram / Handwritten image / Formula if present */}
                  {msg.imageDataUrl && (
                    <div className="mb-3">
                      <div className="relative group inline-block max-w-full">
                        <img
                          src={msg.imageDataUrl}
                          alt="Analyzed Diagram / Note / Formula"
                          className="max-h-72 max-w-full rounded-xl border border-neutral-300 dark:border-neutral-700 object-contain shadow-xs bg-black/10 cursor-pointer transition-transform hover:scale-[1.01]"
                          onClick={() => setZoomImage({
                            url: msg.imageDataUrl!,
                            title: msg.visionCategory === 'formula' ? 'Mathematical Formula / Equation' : msg.visionCategory === 'handwritten' ? 'Handwritten Study Notes' : 'Technical Diagram / Circuit',
                            category: msg.visionCategory
                          })}
                        />
                        <button
                          type="button"
                          onClick={() => setZoomImage({
                            url: msg.imageDataUrl!,
                            title: msg.visionCategory === 'formula' ? 'Mathematical Formula / Equation' : msg.visionCategory === 'handwritten' ? 'Handwritten Study Notes' : 'Technical Diagram / Circuit',
                            category: msg.visionCategory
                          })}
                          className="absolute bottom-2 right-2 px-2 py-1 rounded-lg bg-black/75 hover:bg-black text-white text-[11px] font-medium flex items-center gap-1 opacity-90 group-hover:opacity-100 transition-opacity backdrop-blur-xs cursor-pointer shadow-md"
                        >
                          <Maximize2 className="w-3 h-3" />
                          <span>Zoom</span>
                        </button>
                      </div>

                      <div className="text-[10px] mt-1.5 flex flex-wrap items-center gap-2">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-semibold ${
                          msg.visionCategory === 'formula'
                            ? 'bg-purple-100 text-purple-900 border border-purple-200'
                            : msg.visionCategory === 'handwritten'
                            ? 'bg-amber-100 text-amber-900 border border-amber-200'
                            : 'bg-blue-100 text-blue-900 border border-blue-200'
                        }`}>
                          {msg.visionCategory === 'formula' ? (
                            <>
                              <Sigma className="w-3 h-3" />
                              <span>Formula &amp; Equation</span>
                            </>
                          ) : msg.visionCategory === 'handwritten' ? (
                            <>
                              <FileText className="w-3 h-3" />
                              <span>Handwritten Notes</span>
                            </>
                          ) : (
                            <>
                              <Camera className="w-3 h-3" />
                              <span>Diagram &amp; Architecture</span>
                            </>
                          )}
                        </span>
                        <span className={`text-[10px] ${isAi ? 'text-neutral-500' : 'text-neutral-300'}`}>
                          Analyzed with Gemini Flash Vision
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Markdown-style content rendering */}
                  <div className="whitespace-pre-wrap font-sans text-xs sm:text-sm">
                    {msg.content}
                  </div>

                  {/* Mode indicator, Audio Listen, & Copy */}
                  <div className="mt-2 pt-2 border-t border-neutral-200/60 flex items-center justify-between text-[10px] text-neutral-400">
                    <span className="flex items-center gap-1.5">
                      <span>{msg.timestamp}</span>
                      {speakingMsgId === msg.id && (
                        <span className="text-emerald-600 font-bold flex items-center gap-1 animate-pulse">
                          <Volume2 className="w-3 h-3" /> Speaking...
                        </span>
                      )}
                    </span>
                    {isAi && (
                      <div className="flex items-center gap-3">
                        {speakingMsgId === msg.id ? (
                          <div className="flex items-center gap-2">
                            {/* Animated Equalizer Waveform */}
                            <div className="flex items-center gap-0.5 h-3 px-1">
                              <span className="w-0.5 bg-emerald-500 rounded-full animate-[bounce_0.8s_infinite_100ms] h-2.5" />
                              <span className="w-0.5 bg-emerald-500 rounded-full animate-[bounce_0.8s_infinite_300ms] h-1.5" />
                              <span className="w-0.5 bg-emerald-500 rounded-full animate-[bounce_0.8s_infinite_200ms] h-3" />
                              <span className="w-0.5 bg-emerald-500 rounded-full animate-[bounce_0.8s_infinite_400ms] h-1" />
                            </div>

                            <button
                              type="button"
                              onClick={isPausedSpeech ? resumeSpeech : pauseSpeech}
                              className="text-neutral-800 hover:text-neutral-950 flex items-center gap-1 font-semibold transition-colors cursor-pointer"
                              title={isPausedSpeech ? "Resume speech" : "Pause speech"}
                            >
                              {isPausedSpeech ? <Play className="w-3 h-3 fill-current" /> : <Pause className="w-3 h-3" />}
                              <span>{isPausedSpeech ? 'Resume' : 'Pause'}</span>
                            </button>

                            <button
                              type="button"
                              onClick={stopSpeaking}
                              className="text-red-600 hover:text-red-700 flex items-center gap-1 font-semibold transition-colors cursor-pointer"
                              title="Stop voice playback"
                            >
                              <Square className="w-3 h-3 fill-current" />
                              <span>Stop</span>
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => speak(msg.content, msg.id)}
                            className="hover:text-neutral-950 flex items-center gap-1 transition-colors text-neutral-600 font-medium cursor-pointer"
                            title="Listen to this explanation with AI Voice"
                          >
                            <Volume2 className="w-3.5 h-3.5 text-neutral-700" />
                            <span>Listen ({speechRate}x)</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(msg.content);
                            setCopiedId(msg.id);
                            setTimeout(() => setCopiedId(null), 2000);
                          }}
                          className="hover:text-neutral-950 flex items-center gap-1 transition-colors text-neutral-500"
                        >
                          {copiedId === msg.id ? <Check className="w-3 h-3 text-neutral-900" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedId === msg.id ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Interactive Tutor Action Chips on AI responses */}
                {isAi && msg.canQuizMe && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <button
                      onClick={() => handleSendMessage('Explain this simpler like I am 10 years old with an everyday analogy.')}
                      className="px-2.5 py-1 rounded-lg text-xs font-medium bg-white border border-neutral-200 text-neutral-800 hover:bg-neutral-100 transition-colors flex items-center gap-1 shadow-2xs"
                    >
                      <Lightbulb className="w-3 h-3 text-neutral-900" />
                      <span>Explain Simpler</span>
                    </button>

                    <button
                      onClick={() => handleSendMessage('Can you give me a concrete step-by-step example with numbers or calculation?')}
                      className="px-2.5 py-1 rounded-lg text-xs font-medium bg-white border border-neutral-200 text-neutral-800 hover:bg-neutral-100 transition-colors flex items-center gap-1 shadow-2xs"
                    >
                      <Sparkles className="w-3 h-3 text-neutral-900" />
                      <span>Give Example</span>
                    </button>

                    <button
                      onClick={() => handleSendMessage('Generate an exam-style multiple choice question testing my understanding of what you just explained.')}
                      className="px-2.5 py-1 rounded-lg text-xs font-medium bg-white border border-neutral-200 text-neutral-800 hover:bg-neutral-100 transition-colors flex items-center gap-1 shadow-2xs"
                    >
                      <HelpCircle className="w-3 h-3 text-neutral-900" />
                      <span>Quiz Me</span>
                    </button>

                    <button
                      onClick={() => handleCreateFlashcardFromMessage(msg.content)}
                      className="px-2.5 py-1 rounded-lg text-xs font-medium bg-white border border-neutral-200 text-neutral-800 hover:bg-neutral-100 transition-colors flex items-center gap-1 shadow-2xs"
                    >
                      <Layers className="w-3 h-3 text-neutral-900" />
                      <span>Create Flashcard</span>
                    </button>
                  </div>
                )}

                {/* Follow up suggestions */}
                {isAi && msg.suggestedFollowUps && (
                  <div className="space-y-1 pt-1">
                    <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider block">Suggested Next Steps:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {msg.suggestedFollowUps.map((q, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSendMessage(q)}
                          className="text-xs text-left px-2.5 py-1 rounded-md bg-neutral-100 hover:bg-neutral-200 text-neutral-800 transition-colors"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Loading Skeleton */}
        {isLoading && (
          <div className="flex gap-3 max-w-md mr-auto">
            <div className="w-8 h-8 rounded-full bg-neutral-950 text-white flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 animate-pulse" />
            </div>
            <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 text-neutral-600 text-xs flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-neutral-950 animate-ping" />
              <span>Analyzing material and generating response...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Box */}
      <div className="p-3 sm:p-4 border-t border-neutral-200 bg-white">
        {/* Attached Diagram / Handwritten Image / Formula Preview */}
        {attachedVisionImage && (
          <div className="mb-2.5 px-3 py-2.5 bg-neutral-50 rounded-xl border border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs animate-in fade-in duration-200">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative group shrink-0">
                <img
                  src={attachedVisionImage.dataUrl}
                  alt="Visual Preview"
                  className="w-12 h-12 object-cover rounded-lg border border-neutral-300 bg-white cursor-pointer hover:opacity-90"
                  onClick={() => setZoomImage({
                    url: attachedVisionImage.dataUrl,
                    title: attachedVisionImage.name,
                    category: attachedVisionImage.category
                  })}
                />
                <button
                  type="button"
                  onClick={() => setZoomImage({
                    url: attachedVisionImage.dataUrl,
                    title: attachedVisionImage.name,
                    category: attachedVisionImage.category
                  })}
                  className="absolute inset-0 bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 rounded-lg transition-opacity"
                  title="Enlarge preview"
                >
                  <Eye className="w-4 h-4" />
                </button>
              </div>

              <div className="truncate">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-bold text-neutral-900 truncate">{attachedVisionImage.name}</p>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    attachedVisionImage.category === 'formula'
                      ? 'bg-purple-100 text-purple-900 border border-purple-200'
                      : attachedVisionImage.category === 'handwritten'
                      ? 'bg-amber-100 text-amber-900 border border-amber-200'
                      : 'bg-blue-100 text-blue-900 border border-blue-200'
                  }`}>
                    {attachedVisionImage.category === 'formula' ? '➗ Formula & Math' : attachedVisionImage.category === 'handwritten' ? '✍️ Handwritten' : '📐 Diagram'}
                  </span>
                </div>
                <p className="text-[11px] text-neutral-500 truncate">
                  Ready for Gemini Flash Vision (Server-Side analysis)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                type="button"
                onClick={() => setIsVisionModalOpen(true)}
                className="px-2.5 py-1 rounded-lg bg-neutral-200/70 hover:bg-neutral-200 text-neutral-800 text-xs font-medium transition-colors cursor-pointer"
              >
                Change / Retake
              </button>
              <button
                type="button"
                onClick={() => setAttachedVisionImage(null)}
                className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-200 transition-colors cursor-pointer"
                title="Remove image"
              >
                <CloseIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Hidden File Input for fallback native pick */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImageSelect}
          accept="image/*"
          className="hidden"
        />

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          {/* Voice Mic Button */}
          <button
            type="button"
            onClick={toggleRecording}
            className={`p-3 rounded-xl transition-all border ${isRecording ? 'bg-red-50 text-red-600 border-red-200 animate-pulse' : 'bg-neutral-50 text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 border-neutral-200'} shrink-0 cursor-pointer`}
            title={isRecording ? "Stop recording" : "Start voice speech-to-text"}
          >
            {isRecording ? <Square className="w-5 h-5 fill-current" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Camera / Diagram / Formula Vision Button */}
          <button
            type="button"
            onClick={() => setIsVisionModalOpen(true)}
            className={`p-3 rounded-xl transition-all border shrink-0 cursor-pointer relative ${
              attachedVisionImage
                ? 'bg-neutral-950 text-white border-neutral-950 shadow-xs'
                : 'bg-neutral-50 text-neutral-700 hover:bg-neutral-100 hover:text-neutral-950 border-neutral-200'
            }`}
            title="Open Gemini Flash Vision: Camera Capture or Upload Diagram, Handwritten Notes, Formula"
          >
            <Camera className="w-5 h-5" />
            {attachedVisionImage && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white" />
            )}
          </button>

          {/* Text Input */}
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            placeholder={
              isRecording
                ? "Listening (speak now)..."
                : attachedVisionImage
                ? `Ask about this ${attachedVisionImage.category || 'image'} (or leave blank to analyze step-by-step)...`
                : `Ask a question in ${tutorMode} mode, or ask to derive, solve, summarize...`
            }
            disabled={isLoading}
            className={`flex-1 px-4 py-2.5 rounded-xl border ${isRecording ? 'border-red-200 bg-red-50/30' : 'border-neutral-200'} focus:outline-hidden focus:ring-1 focus:ring-neutral-900 text-sm placeholder:text-neutral-400 disabled:opacity-50`}
          />

          {/* Send Button */}
          <button
            type="submit"
            disabled={isLoading || (!inputQuery.trim() && !attachedVisionImage)}
            className="px-4 py-2.5 rounded-xl bg-neutral-950 hover:bg-black text-white font-semibold text-sm flex items-center gap-2 disabled:opacity-50 transition-colors shadow-xs cursor-pointer"
          >
            <span>Ask</span>
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Gemini Flash Vision Capture & Upload Modal */}
      <VisionCaptureModal
        isOpen={isVisionModalOpen}
        onClose={() => setIsVisionModalOpen(false)}
        onSelectImage={(payload) => {
          setAttachedVisionImage(payload);
          if (payload.defaultPrompt) {
            setInputQuery(payload.defaultPrompt);
          }
        }}
      />

      {/* Image Lightbox Zoom Modal */}
      {zoomImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setZoomImage(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-neutral-900 rounded-2xl overflow-hidden border border-neutral-700 shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-3 bg-neutral-950 border-b border-neutral-800 flex items-center justify-between text-white">
              <div className="flex items-center gap-2 truncate">
                <Camera className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold truncate">{zoomImage.title}</span>
                {zoomImage.category && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300 uppercase font-semibold">
                    {zoomImage.category}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setZoomImage(null)}
                className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                <CloseIcon className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 flex items-center justify-center overflow-auto max-h-[calc(90vh-4rem)]">
              <img
                src={zoomImage.url}
                alt={zoomImage.title}
                className="max-h-[75vh] w-auto max-w-full rounded-lg object-contain"
              />
            </div>
          </div>
        </div>
      )}

      {/* Real-Time Firestore Sync Status Details Modal */}
      {showSyncInfoModal && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setShowSyncInfoModal(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full p-5 border border-neutral-200 shadow-2xl text-left"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <h3 className="text-sm font-bold text-neutral-950">Firestore Live Real-Time Sync</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowSyncInfoModal(false)}
                className="p-1 text-neutral-400 hover:text-neutral-700 rounded-lg cursor-pointer"
              >
                <CloseIcon className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-emerald-900 leading-relaxed">
                <p className="font-semibold mb-1 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  Live Sync &amp; Backend Verification
                </p>
                <p className="text-[11px] text-emerald-800">
                  StudyMate AI maintains live Firestore snapshot listeners. All AI operations (Gemini Flash Vision, TTS, chat generation) run exclusively server-side in the backend Node.js container with zero client secret exposure.
                </p>
              </div>

              <div className="space-y-2 border border-neutral-200 rounded-xl p-3 bg-neutral-50/50">
                <div className="flex justify-between py-1 border-b border-neutral-200/50 text-neutral-600">
                  <span>Firestore Connection:</span>
                  <span className="font-semibold text-emerald-700">● Live onSnapshot Active</span>
                </div>
                <div className="flex justify-between py-1 border-b border-neutral-200/50 text-neutral-600">
                  <span>Cloud Database:</span>
                  <span className="font-mono text-[10px] text-neutral-800 truncate max-w-[170px]" title="ai-studio-studymateai-8272d6d6-84fd-42d1-a40b-28b92f956ed9">
                    ai-studio-studymateai...
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-neutral-200/50 text-neutral-600">
                  <span>AI Execution:</span>
                  <span className="font-semibold text-neutral-800">Server-Side Express (/api/ai/chat)</span>
                </div>
                <div className="flex justify-between py-1 border-b border-neutral-200/50 text-neutral-600">
                  <span>Active Profile:</span>
                  <span className="font-medium text-neutral-900">{user?.email || 'Local Active Profile'}</span>
                </div>
                <div className="flex justify-between py-1 text-neutral-600">
                  <span>Last Synchronization:</span>
                  <span className="text-neutral-500">
                    {lastRealtimeSync ? lastRealtimeSync.toLocaleTimeString() : 'Continuous'}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-5 flex items-center gap-2">
              <button
                type="button"
                onClick={async () => {
                  await syncToFirestore();
                }}
                disabled={isSyncing}
                className="flex-1 py-2 rounded-xl bg-neutral-950 hover:bg-black text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 shadow-xs"
              >
                <Cloud className="w-4 h-4" />
                <span>{isSyncing ? 'Syncing...' : 'Force Cloud Sync Now'}</span>
              </button>
              {!user && (
                <button
                  type="button"
                  onClick={() => {
                    setShowSyncInfoModal(false);
                    loginWithGoogle();
                  }}
                  className="py-2 px-3 rounded-xl border border-neutral-200 hover:bg-neutral-100 text-neutral-800 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Sign In
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
