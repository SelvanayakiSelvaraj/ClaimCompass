/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from 'react';
import { MessageSquare, X, Send, RotateCw, Globe, ChevronDown, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Message {
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

const LANGUAGES = [
  { code: 'English', label: 'English', flag: '🇬🇧' },
  { code: 'Hindi', label: 'हिन्दी (Hindi)', flag: '🇮🇳' },
  { code: 'Tamil', label: 'தமிழ் (Tamil)', flag: '🇮🇳' },
  { code: 'Telugu', label: 'తెలుగు (Telugu)', flag: '🇮🇳' },
  { code: 'Bengali', label: 'বাংলা (Bengali)', flag: '🇮🇳' },
];

const SUGGESTIONS: Record<string, string[]> = {
  English: [
    "What are my matched programs?",
    "Which documents are missing?",
    "Tell me about PM-KISAN grant",
    "How does the SDRF grant work?"
  ],
  Hindi: [
    "मेरे कौन से कार्यक्रम मेल खाते हैं?",
    "कौन से दस्तावेज़ गायब हैं?",
    "पीएम-किसान अनुदान के बारे में बताएं",
    "एसडीआरएफ (SDRF) अनुदान कैसे काम करता है?"
  ],
  Tamil: [
    "எனக்கு என்னென்ன மானியங்கள் கிடைத்துள்ளன?",
    "என்னென்ன ஆவணங்கள் சமர்ப்பிக்க வேண்டும்?",
    "பிஎம்-கிசான் மானியம் பற்றி கூறுங்கள்",
    "எஸ்டிஆர்எஃப் (SDRF) மானியம் எவ்வாறு செயல்படுகிறது?"
  ],
  Telugu: [
    "నాకు ఏయే పథకాలు సరిపోలాయి?",
    "ఏ డాక్యుమెంట్లు సమర్పించాలి?",
    "పిఎమ్-కిసాన్ పథకం గురించి చెప్పండి",
    "ఎస్ డి ఆర్ ఎఫ్ గ్రాంట్ ఎలా పనిచేస్తుంది?"
  ],
  Bengali: [
    "আমার কোন কোন প্রকল্প মিলেছে?",
    "কোন কোন নথিপত্র বাকি আছে?",
    "পিএম-কিসান প্রকল্প সম্পর্কে বলুন",
    "এসডিআরএফ (SDRF) অনুদান কীভাবে কাজ করে?"
  ]
};

const GREETINGS: Record<string, string> = {
  English: "Hello! I am **ReliefBot**, your ClaimCompass assistant. I can help you understand your matched disaster programs, check for missing documents in your vault, and monitor your application status. What would you like to know?",
  Hindi: "नमस्ते! मैं **रिलीफबॉट (ReliefBot)** हूँ, आपका क्लेमकम्पास सहायक। मैं आपको आपदा राहत कार्यक्रमों को समझने, गायब दस्तावेजों की जांच करने और आपकी आवेदन स्थिति की निगरानी करने में मदद कर सकता हूँ। आप क्या जानना चाहते हैं?",
  Tamil: "வணக்கம்! நான் **ரிலீஃப்பாட் (ReliefBot)**, உங்கள் கிளைம்காம்பஸ் உதவியாளர். உங்களது தகுதியான பேரிடர் திட்டங்களைப் புரிந்துகொள்ளவும், விடுபட்ட ஆவணங்களைச் சரிபார்க்கவும், விண்ணப்ப நிலைகளைக் கண்காணிக்கவும் நான் உதவ முடியும். நீங்கள் என்ன தெரிந்து கொள்ள விரும்புகிறீர்கள்?",
  Telugu: "నమస్తే! నేను **రిలీఫ్ బాట్ (ReliefBot)**, మీ క్లెయిమ్‌కంపాస్ సహాయకుడిని. డిజాస్టర్ రిలీఫ్ పథకాలను అర్థం చేసుకోవడానికి, మిస్సయిన డాక్యుమెంట్లను తనిఖీ చేయడానికి మరియు అప్లికేషన్ల స్థితిని పర్యవేక్షించడానికి నేను మీకు సహాయం చేయగలను. మీరు ఏమి తెలుసుకోవాలనుకుంటున్నారు?",
  Bengali: "নমস্কার! আমি **রিলিফবট (ReliefBot)**, আপনার ক্লেমকম্পাস সহায়ক। আমি আপনাকে দুর্যোগ ত্রাণ প্রকল্পগুলি বুঝতে, বাকি থাকা নথিপত্র পরীক্ষা করতে এবং আপনার আবেদনের অগ্রগতি ট্র্যাক করতে সাহায্য করতে পারি। আপনি কি জানতে চান?"
};

export default function Chatbot() {
  const [isOpen, setIsOpen] = React.useState<boolean>(false);
  const [language, setLanguage] = React.useState<string>('English');
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [input, setInput] = React.useState<string>('');
  const [isGenerating, setIsGenerating] = React.useState<boolean>(false);
  const [langDropdownOpen, setLangDropdownOpen] = React.useState<boolean>(false);
  const messagesEndRef = React.useRef<HTMLDivElement | null>(null);

  // Initialize messages on language change
  React.useEffect(() => {
    const defaultGreeting = GREETINGS[language] || GREETINGS['English'];
    setMessages([
      {
        role: 'model',
        text: defaultGreeting,
        timestamp: new Date()
      }
    ]);
  }, [language]);

  // Scroll to bottom
  React.useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || isGenerating) return;

    const userMsg: Message = {
      role: 'user',
      text: textToSend,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsGenerating(true);

    try {
      // Format history
      const formattedHistory = messages.map(m => ({
        role: m.role,
        text: m.text
      }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: textToSend,
          history: formattedHistory,
          language: language
        })
      });

      if (res.ok) {
        const data = await res.json();
        const modelMsg: Message = {
          role: 'model',
          text: data.text,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, modelMsg]);
      } else {
        throw new Error('Chat API returned error code ' + res.status);
      }
    } catch (err) {
      console.error('Failed to communicate with chatbot:', err);
      // Local fallback simulation based on language
      const fallbackText = "I'm having a bit of trouble connecting to my central brain. Please check your internet connection or make sure the server is fully running.";
      setMessages(prev => [...prev, {
        role: 'model',
        text: fallbackText,
        timestamp: new Date()
      }]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleResetChat = () => {
    const defaultGreeting = GREETINGS[language] || GREETINGS['English'];
    setMessages([
      {
        role: 'model',
        text: defaultGreeting,
        timestamp: new Date()
      }
    ]);
  };

  const selectedLangObj = LANGUAGES.find(l => l.code === language) || LANGUAGES[0];

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            layoutId="chatbot-container"
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-2 bg-[#E03F4F] text-[#FFFAF0] px-4 py-3.5 rounded-full shadow-lg hover:bg-opacity-95 transition-all duration-300 active:scale-95 focus:outline-none select-none cursor-pointer border border-[#E03F4F]/20"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
          >
            <MessageSquare className="w-5 h-5 animate-pulse" />
            <span className="text-xs font-black tracking-wide uppercase flex items-center gap-1">
              ReliefBot
              <span className="text-[9px] bg-white/20 px-1.5 py-0.5 rounded-full">
                {selectedLangObj.flag}
              </span>
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            layoutId="chatbot-container"
            className="w-80 sm:w-[360px] h-[480px] bg-white border-2 border-[#81912F]/35 rounded-2xl shadow-xl flex flex-col overflow-hidden"
            initial={{ opacity: 0, y: 100, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.9 }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
          >
            {/* Header */}
            <div className="bg-[#FFFAF0] border-b-2 border-[#81912F]/20 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#E03F4F]/10 flex items-center justify-center">
                  <Sparkles className="w-4.5 h-4.5 text-[#E03F4F]" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-[#181C06] tracking-tight flex items-center gap-1">
                    ReliefBot
                    <span className="w-1.5 h-1.5 rounded-full bg-[#81912F] animate-ping"></span>
                  </h3>
                  <p className="text-[9px] text-[#181C06] opacity-70 font-semibold uppercase tracking-wider">Disaster Support</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Language Picker Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                    className="flex items-center gap-1.5 bg-white border border-[#81912F]/30 hover:border-[#81912F]/50 text-[10px] font-bold px-2 py-1 rounded-md transition"
                  >
                    <Globe className="w-3.5 h-3.5 text-[#81912F]" />
                    <span>{selectedLangObj.label.split(' ')[0]}</span>
                    <ChevronDown className="w-3 h-3 text-stone-500" />
                  </button>

                  <AnimatePresence>
                    {langDropdownOpen && (
                      <motion.div
                        className="absolute right-0 mt-1 w-36 bg-white border border-[#81912F]/20 rounded-lg shadow-lg z-50 py-1 overflow-hidden"
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                      >
                        {LANGUAGES.map(lang => (
                          <button
                            key={lang.code}
                            onClick={() => {
                              setLanguage(lang.code);
                              setLangDropdownOpen(false);
                            }}
                            className={`w-full text-left px-3 py-1.5 text-[10px] font-semibold hover:bg-[#FFFAF0] transition flex items-center gap-2 ${
                              language === lang.code ? 'bg-[#81912F]/10 text-[#81912F]' : 'text-stone-700'
                            }`}
                          >
                            <span>{lang.flag}</span>
                            <span>{lang.label}</span>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <button
                  onClick={handleResetChat}
                  title="Clear Conversation"
                  className="p-1.5 rounded-lg border border-[#81912F]/20 hover:bg-stone-100 text-stone-500 transition active:scale-95"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-[#E03F4F]/10 text-stone-500 hover:text-[#E03F4F] transition active:scale-95"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>
            </div>

            {/* Messages Body */}
            <div className="flex-grow p-4 overflow-y-auto bg-stone-50/50 space-y-3.5">
              {messages.map((m, idx) => {
                const isModel = m.role === 'model';
                return (
                  <div
                    key={idx}
                    className={`flex ${isModel ? 'justify-start' : 'justify-end'}`}
                  >
                    <div
                      className={`max-w-[82%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed shadow-sm ${
                        isModel
                          ? 'bg-white text-[#181C06] border border-[#81912F]/15 rounded-tl-sm'
                          : 'bg-[#E03F4F] text-[#FFFAF0] rounded-tr-sm'
                      }`}
                    >
                      {/* Very basic render helper to support bold styling '**text**' */}
                      <p className="whitespace-pre-wrap">
                        {m.text.split('**').map((chunk, i) => 
                          i % 2 === 1 ? <strong key={i} className="font-bold">{chunk}</strong> : chunk
                        )}
                      </p>
                      <span className={`text-[8px] mt-1 block text-right font-medium ${isModel ? 'text-stone-400' : 'text-[#FFFAF0]/70'}`}>
                        {m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                );
              })}

              {isGenerating && (
                <div className="flex justify-start">
                  <div className="bg-white text-[#181C06] border border-[#81912F]/15 px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#E03F4F] animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#E03F4F] animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#E03F4F] animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Suggestions Chips */}
            <div className="px-3.5 py-2 bg-[#FFFAF0]/50 border-t border-[#81912F]/15 flex items-center gap-1.5 overflow-x-auto whitespace-nowrap scrollbar-none">
              {(SUGGESTIONS[language] || SUGGESTIONS['English']).map((sug, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(sug)}
                  className="bg-white border border-[#81912F]/20 hover:bg-[#81912F]/10 hover:border-[#81912F]/45 text-[10px] font-semibold text-[#181C06]/85 px-2.5 py-1.5 rounded-full transition active:scale-95 select-none cursor-pointer flex-shrink-0"
                >
                  {sug}
                </button>
              ))}
            </div>

            {/* Input Footer */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend(input);
              }}
              className="p-3 bg-white border-t-2 border-[#81912F]/15 flex items-center gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={language === 'Hindi' ? 'यहाँ संदेश लिखें...' : language === 'Tamil' ? 'இங்கு செய்தி எழுதவும்...' : language === 'Telugu' ? 'ఇక్కడ సందేశం రాయండి...' : 'Type a message...'}
                className="flex-grow border border-stone-200 focus:border-[#81912F] focus:outline-none text-xs px-3.5 py-2 rounded-xl transition bg-stone-50 focus:bg-white"
                disabled={isGenerating}
              />
              <button
                type="submit"
                disabled={!input.trim() || isGenerating}
                className="bg-[#E03F4F] text-[#FFFAF0] p-2 rounded-xl hover:bg-opacity-95 transition disabled:opacity-40 disabled:scale-100 active:scale-95 flex items-center justify-center cursor-pointer flex-shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
