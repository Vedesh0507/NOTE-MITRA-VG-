'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  Download,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Send,
  X,
  Bot,
  User,
  Loader2,
  AlertCircle,
  Info,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { notesAPI, aiAPI, getAPIBaseUrl } from '@/lib/api';

interface Note {
  id?: string;
  _id?: string;
  title: string;
  description: string;
  subject: string;
  semester: string;
  branch: string;
  fileId?: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  hasContext?: boolean;
}

export default function PDFPreviewPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const noteId = params?.id as string;

  // PDF State
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [zoom, setZoom] = useState(100);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Chat State
  const [chatOpen, setChatOpen] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [aiStatus, setAiStatus] = useState<{
    configured: boolean;
    remaining?: number;
  }>({ configured: true });
  const [cooldown, setCooldown] = useState(0);

  // Refs
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Fetch note details
  useEffect(() => {
    if (noteId) {
      fetchNoteDetails();
      checkAIStatus();
    }
  }, [noteId]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Cooldown timer
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const fetchNoteDetails = async () => {
    try {
      setLoading(true);
      const response = await notesAPI.getNoteById(noteId);
      const fetchedNote = response.data.note;
      setNote(fetchedNote);

      // Build PDF URL
      const apiBase = getAPIBaseUrl();
      const fileId = fetchedNote.fileId || fetchedNote._id || noteId;
      setPdfUrl(`${apiBase}/notes/view-pdf/${fileId}`);

      // Add welcome message
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: `👋 Hi! I'm your AI study assistant. I'm here to help you understand "${fetchedNote.title}".

Ask me anything about:
• Concepts explained in this PDF
• Clarification on specific topics
• Related examples or explanations
• General questions about ${fetchedNote.subject}

Just type your question below!`,
        timestamp: new Date(),
        hasContext: false
      }]);

    } catch (error) {
      console.error('Failed to fetch note:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkAIStatus = async () => {
    try {
      const response = await aiAPI.getStatus();
      setAiStatus({
        configured: response.data.configured,
        remaining: response.data.rateLimit?.maxPerHour
      });
    } catch (error) {
      console.error('Failed to check AI status:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || sendingMessage || cooldown > 0) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setSendingMessage(true);

    try {
      // Try to get text from PDF if possible (for typed PDFs)
      // Note: Due to CORS restrictions, we might not always be able to extract text
      let pageText = '';

      const response = await aiAPI.chat({
        message: userMessage.content,
        pageText: pageText || undefined,
        userId: user?.id,
        noteId: noteId
      });

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response.data.response,
        timestamp: new Date(),
        hasContext: response.data.hasContext
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Update rate limit info
      if (response.data.rateLimit) {
        setAiStatus(prev => ({
          ...prev,
          remaining: response.data.rateLimit.remaining
        }));
      }

      // Set cooldown
      setCooldown(10);

    } catch (error: any) {
      console.error('AI Chat error:', error);
      console.error('AI Chat error response:', error.response?.data);

      let errorMessage = 'Sorry, I encountered an error. Please try again.';

      if (error.response?.status === 429) {
        const data = error.response.data;
        if (data.type === 'cooldown' || data.errorType === 'cooldown') {
          errorMessage = `Please wait ${data.retryAfter} seconds before sending another message.`;
          setCooldown(data.retryAfter);
        } else if (data.type === 'hourly_limit' || data.errorType === 'hourly_limit') {
          errorMessage = `You've reached the hourly limit of AI queries. Please try again in ${data.retryAfter} minutes.`;
        } else if (data.errorType === 'rate_limit') {
          errorMessage = data.message || `The AI service is currently busy. Please wait ${data.retryAfter || 60} seconds and try again.`;
          if (data.retryAfter) setCooldown(data.retryAfter);
        }
      } else if (error.response?.status === 503) {
        // Service unavailable - configuration or model issues
        errorMessage = error.response.data?.message || 'The AI service is temporarily unavailable. Please try again later.';
      } else if (error.response?.status === 400) {
        // Bad request - content blocked or invalid input
        errorMessage = error.response.data?.message || 'There was an issue with your question. Please try rephrasing it.';
      } else if (error.response?.data?.response) {
        // Use the fallback response from backend
        errorMessage = error.response.data.response;
      } else if (error.response?.data?.message) {
        // Use the message from backend
        errorMessage = error.response.data.message;
      } else if (!error.response) {
        // Network error - no response from server
        errorMessage = 'Unable to connect to the AI service. Please check your internet connection.';
      }

      const errorResponse: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: errorMessage,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setSendingMessage(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleDownload = async () => {
    if (!note) return;
    try {
      const downloadNoteId = note._id || note.id || noteId;
      await notesAPI.trackDownload(downloadNoteId as string);
      
      const apiBase = getAPIBaseUrl();
      const downloadUrl = `${apiBase}/notes/${downloadNoteId}/download`;
      window.open(downloadUrl, '_blank');
    } catch (error) {
      console.error('Download error:', error);
    }
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 25, 200));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 25, 50));

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    setChatOpen(!isFullscreen);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading PDF...</p>
        </div>
      </div>
    );
  }

  if (!note) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center text-white">
          <h2 className="text-2xl font-bold mb-2">Note not found</h2>
          <Button onClick={() => router.push('/browse')}>Browse Notes</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-900">
      {/* Top Toolbar */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="text-gray-300 hover:text-white hover:bg-gray-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="text-white">
            <h1 className="font-medium truncate max-w-md">{note.title}</h1>
            <p className="text-xs text-gray-400">{note.subject} • Semester {note.semester}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Zoom Controls */}
          <div className="flex items-center gap-1 bg-gray-700 rounded-lg px-2 py-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleZoomOut}
              className="text-gray-300 hover:text-white p-1 h-auto"
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="text-gray-300 text-sm w-12 text-center">{zoom}%</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleZoomIn}
              className="text-gray-300 hover:text-white p-1 h-auto"
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
          </div>

          {/* Toggle Fullscreen */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleFullscreen}
            className="text-gray-300 hover:text-white hover:bg-gray-700"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </Button>

          {/* Toggle Chat */}
          {!isFullscreen && (
            <Button
              variant={chatOpen ? "default" : "ghost"}
              size="sm"
              onClick={() => setChatOpen(!chatOpen)}
              className={chatOpen ? "" : "text-gray-300 hover:text-white hover:bg-gray-700"}
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              AI Chat
            </Button>
          )}

          {/* Download */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDownload}
            className="text-gray-300 hover:text-white hover:bg-gray-700"
          >
            <Download className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* PDF Viewer */}
        <div className={`flex-1 bg-gray-800 overflow-auto ${isFullscreen ? 'w-full' : chatOpen ? 'w-[65%]' : 'w-full'}`}>
          <div className="h-full flex items-center justify-center p-4">
            <iframe
              ref={iframeRef}
              src={pdfUrl}
              className="w-full h-full rounded-lg border border-gray-700"
              style={{
                transform: `scale(${zoom / 100})`,
                transformOrigin: 'center center',
                minHeight: '100%'
              }}
              title="PDF Preview"
            />
          </div>
        </div>

        {/* AI Chat Panel */}
        {chatOpen && !isFullscreen && (
          <div className="w-[35%] min-w-[350px] max-w-[500px] bg-white border-l border-gray-200 flex flex-col">
            {/* Chat Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-white" />
                <div>
                  <h2 className="text-white font-semibold">AI Study Assistant</h2>
                  <p className="text-blue-100 text-xs">
                    {aiStatus.remaining !== undefined ? `${aiStatus.remaining} queries left` : 'Ready to help'}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setChatOpen(false)}
                className="text-white hover:bg-white/20"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Context Notice */}
            <div className="px-4 py-2 bg-yellow-50 border-b border-yellow-200">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-yellow-700">
                  AI answers are based on general knowledge. Specific PDF content analysis requires text extraction.
                </p>
              </div>
            </div>

            {/* Messages Container */}
            <div
              ref={chatContainerRef}
              className="flex-1 overflow-y-auto p-4 space-y-4"
            >
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  {/* Avatar */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                  }`}>
                    {message.role === 'user' ? (
                      <User className="w-4 h-4" />
                    ) : (
                      <Bot className="w-4 h-4" />
                    )}
                  </div>

                  {/* Message Bubble */}
                  <div className={`max-w-[80%] ${message.role === 'user' ? 'text-right' : ''}`}>
                    <div className={`rounded-2xl px-4 py-2 ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white rounded-tr-sm'
                        : 'bg-gray-100 text-gray-800 rounded-tl-sm'
                    }`}>
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    </div>
                    <p className="text-xs text-gray-400 mt-1 px-2">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}

              {/* Typing Indicator */}
              {sendingMessage && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-3">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="border-t border-gray-200 p-4">
              {/* Cooldown Warning */}
              {cooldown > 0 && (
                <div className="mb-2 text-xs text-orange-600 flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Wait {cooldown}s before next message
                </div>
              )}

              <div className="flex gap-2">
                <textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask a question about this topic..."
                  disabled={sendingMessage || cooldown > 0}
                  rows={2}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || sendingMessage || cooldown > 0}
                  className="self-end"
                >
                  {sendingMessage ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>

              {/* Quick Suggestions */}
              <div className="mt-2 flex flex-wrap gap-1">
                {['Explain this concept', 'Give an example', 'Summarize key points'].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => setInputMessage(suggestion)}
                    disabled={sendingMessage}
                    className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-600 transition disabled:opacity-50"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
