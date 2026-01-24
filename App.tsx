
import React, { useState, useEffect, useRef } from 'react';
import StatusCard from './components/StatusCard';
import RiskMeter from './components/RiskMeter';
import { analyzeTranscript, generateInterventionSpeech } from './services/geminiService';
import { liveAudioService } from './services/liveAudioService';
import { RiskLevel, TranscriptEntry, RiskReport } from './types';

const App: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [liveText, setLiveText] = useState("");
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [riskReport, setRiskReport] = useState<RiskReport>({
    score: 1,
    level: RiskLevel.LOW,
    reason: 'System idle or safe environment.',
    actions: [],
    detections: []
  });
  const [isAlerting, setIsAlerting] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scamScenarios = [
    "[SCAMMER]: Hello, I am calling from the bank's fraud department. We noticed a suspicious $2,000 transaction. Please confirm your password to block it.",
    "[SCAMMER]: This is Federal Support. Your social security number has been flagged for criminal activity. Please stay on the line.",
    "[SCAMMER]: Congratulations! You've won a $500 gift card. I just need your credit card number to verify your identity.",
    "[SCAMMER]: Your computer is infected with a serious virus. Please download this remote access software immediately so I can fix it."
  ];

  const toggleProtection = () => {
    if (!isActive) {
      setIsActive(true);
      setTranscript([{
        id: 'init',
        text: 'Guardia monitoring system active. Real-time diarization engaged.',
        sender: 'system',
        timestamp: Date.now()
      }]);
    } else {
      setIsActive(false);
      setIsListening(false);
      liveAudioService.stop();
      setTranscript([]);
      setRiskReport({
        score: 1,
        level: RiskLevel.LOW,
        reason: 'Protection disabled.',
        actions: [],
        detections: []
      });
      setIsAlerting(false);
    }
  };

  const toggleListening = async () => {
    if (!isActive) return;
    
    if (!isListening) {
      setIsListening(true);
      await liveAudioService.start({
        onTranscription: (text, isFinal) => {
          if (isFinal) {
            handleIncomingTranscription(text);
            setLiveText("");
          } else {
            setLiveText(text);
          }
        },
        onError: (err) => {
          setIsListening(false);
          addTranscript(`Audio error: ${err}`, 'system');
        },
        onClose: () => setIsListening(false),
      });
    } else {
      setIsListening(false);
      liveAudioService.stop();
    }
  };

  const handleIncomingTranscription = (fullText: string) => {
    // Basic Diarization Parsing
    const scammerMatch = fullText.match(/^\[SCAMMER\]:?\s*(.*)/i);
    const userMatch = fullText.match(/^\[USER\]:?\s*(.*)/i);

    if (scammerMatch) {
      addTranscript(scammerMatch[1] || fullText, 'scammer');
    } else if (userMatch) {
      addTranscript(userMatch[1] || fullText, 'user');
    } else {
      addTranscript(fullText, 'scammer');
    }
  };

  const addTranscript = (text: string, sender: 'user' | 'scammer' | 'system') => {
    const newEntry: TranscriptEntry = {
      id: Math.random().toString(36).substr(2, 9),
      text,
      sender,
      timestamp: Date.now()
    };
    setTranscript(prev => [...prev, newEntry]);
  };

  const triggerDemoScam = () => {
    if (!isActive) return;
    const scenario = scamScenarios[Math.floor(Math.random() * scamScenarios.length)];
    handleIncomingTranscription(scenario);
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcript, liveText]);

  useEffect(() => {
    const lastMessage = transcript.filter(t => t.sender === 'scammer').pop();
    if (lastMessage && isActive) {
      const runAnalysis = async () => {
        const report = await analyzeTranscript(lastMessage.text);
        setRiskReport(report);
        if (report.level === RiskLevel.HIGH) {
          setIsAlerting(true);
          const intervention = await generateInterventionSpeech(report.reason);
          addTranscript(`[GUARDIA INTERVENTION]: ${intervention}`, 'system'); 
        } else {
          setIsAlerting(false);
        }
      };
      runAnalysis();
    }
  }, [transcript, isActive]);

  const getSentimentIcon = (sentiment?: string) => {
    if (!sentiment) return 'fa-face-meh';
    const s = sentiment.toLowerCase();
    if (s.includes('urgent')) return 'fa-bolt';
    if (s.includes('fear') || s.includes('worried')) return 'fa-face-frown-open';
    if (s.includes('threat')) return 'fa-skull-crossbones';
    if (s.includes('assertive') || s.includes('authoritative')) return 'fa-bullhorn';
    return 'fa-face-smile';
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="px-6 py-4 flex items-center justify-between border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
            <i className="fas fa-fingerprint text-white text-xl"></i>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tighter">GUARD.<span className="text-blue-500">IA</span></h1>
            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-[0.2em]">Live Protection Hub</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex flex-col items-end">
            <span className="text-xs text-slate-400">Security Demo Mode</span>
            <div className="flex items-center gap-2">
               <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
               <span className="text-sm font-semibold text-blue-400 uppercase tracking-tighter">Real-time Analysis Active</span>
            </div>
          </div>
          <button 
            onClick={toggleProtection}
            className={`px-6 py-2 rounded-full font-bold transition-all ${
              isActive 
                ? 'bg-red-500/10 text-red-500 border border-red-500/50 hover:bg-red-500 hover:text-white' 
                : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/30'
            }`}
          >
            {isActive ? 'Stop Protection' : 'Activate Protection'}
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-6">
          <StatusCard isActive={isActive} isAlerting={isAlerting} />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col items-center justify-center min-h-[300px] shadow-xl">
              <h4 className="text-sm text-slate-500 font-bold uppercase mb-6 self-start tracking-wider">Risk Analysis (1-10)</h4>
              <RiskMeter score={riskReport.score} />
              
              {riskReport.sentiment && (
                <div className="mt-6 flex flex-col items-center animate-in fade-in slide-in-from-bottom-2 duration-500">
                  <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs font-bold uppercase tracking-wider ${
                    riskReport.sentiment.intensity > 70 
                      ? 'bg-red-500/20 border-red-500/40 text-red-400' 
                      : 'bg-blue-500/20 border-blue-500/40 text-blue-400'
                  }`}>
                    <i className={`fas ${getSentimentIcon(riskReport.sentiment.primary)}`}></i>
                    <span>{riskReport.sentiment.primary}</span>
                    <span className="opacity-50 ml-1">({riskReport.sentiment.intensity}%)</span>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col shadow-xl">
              <h4 className="text-sm text-slate-500 font-bold uppercase mb-4 tracking-wider">Detection Triggers</h4>
              <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar max-h-[220px]">
                {riskReport.detections.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-600 italic text-sm">
                    <i className="fas fa-satellite-dish mb-2 text-2xl animate-pulse"></i>
                    Awaiting patterns...
                  </div>
                ) : (
                  riskReport.detections.map((det, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-xl border border-slate-700/50 group hover:border-red-500/50 transition-all">
                      <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <i className="fas fa-exclamation-triangle text-red-400 text-xs"></i>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-red-400">"{det.keyword}"</p>
                        <p className="text-[10px] text-slate-500 uppercase font-mono">{det.category}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
              <h4 className="text-sm text-slate-500 font-bold uppercase mb-4 tracking-wider">AI Reasoning</h4>
              <div className="text-slate-300 text-sm leading-relaxed p-4 bg-slate-800/30 border border-slate-700/50 rounded-xl italic min-h-[100px]">
                {riskReport.reason}
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
              <h4 className="text-sm text-slate-500 font-bold uppercase mb-4 tracking-wider">Recommended Actions</h4>
              <div className="space-y-2">
                {riskReport.actions.length > 0 ? (
                  riskReport.actions.map((action, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg animate-in slide-in-from-right duration-300" style={{ animationDelay: `${i * 100}ms` }}>
                       <i className="fas fa-shield-halved text-red-400 text-xs"></i>
                       <span className="text-sm text-red-100 font-medium">{action}</span>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-6 gap-2">
                    <i className="fas fa-check-double text-green-500/20 text-3xl"></i>
                    <p className="text-xs text-slate-600 italic">No threats requiring action.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Live Call Monitor */}
        <div className="lg:col-span-5 flex flex-col h-[600px] lg:h-auto overflow-hidden bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl relative">
          <div className="scanline"></div>
          <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/80 backdrop-blur-sm z-10">
            <div className="flex flex-col">
              <h4 className="text-sm text-slate-500 font-bold uppercase tracking-widest">Call Monitor</h4>
              <span className="text-[10px] text-blue-500 font-mono">Diarization Enabled</span>
            </div>
            <div className="flex items-center gap-2">
               {isListening && (
                 <div className="flex items-center gap-2 px-2 py-1 bg-red-500/10 rounded-md border border-red-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping"></span>
                    <span className="text-[10px] font-mono text-red-400">LIVE_INPUT</span>
                 </div>
               )}
               <span className="text-[10px] font-mono text-slate-500">ENCRYPTED</span>
            </div>
          </div>

          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar bg-slate-950/20"
          >
            {transcript.map((entry) => (
              <div 
                key={entry.id} 
                className={`flex flex-col ${
                  entry.sender === 'user' 
                    ? 'items-end' 
                    : entry.sender === 'scammer' 
                      ? 'items-start' 
                      : 'items-center'
                }`}
              >
                <div className={`max-w-[85%] p-4 rounded-2xl text-sm transition-all animate-in zoom-in-95 duration-200 ${
                  entry.sender === 'user'
                    ? 'bg-blue-600 text-white rounded-tr-none shadow-lg'
                    : entry.sender === 'scammer'
                      ? 'bg-slate-800 text-slate-200 border border-slate-700 rounded-tl-none shadow-md'
                      : 'bg-red-900/40 text-red-200 border border-red-500/40 font-bold rounded-xl text-center italic py-2 px-6'
                }`}>
                  {entry.text}
                </div>
                <div className="flex items-center gap-2 mt-2 px-1">
                   <span className={`text-[9px] font-bold tracking-widest uppercase ${
                     entry.sender === 'user' ? 'text-blue-400' : entry.sender === 'scammer' ? 'text-slate-500' : 'text-red-500'
                   }`}>
                    {entry.sender === 'system' ? 'GUARDIA INTERVENTION' : entry.sender}
                   </span>
                   <span className="text-[8px] text-slate-700 font-mono">{new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            ))}
            
            {liveText && (
               <div className="flex flex-col items-start opacity-60 animate-in fade-in duration-300">
                  <div className="max-w-[85%] p-3 rounded-2xl text-sm bg-slate-800/20 text-slate-400 border border-dashed border-slate-700 rounded-tl-none italic font-mono">
                    <span className="animate-pulse mr-1">_</span>{liveText}
                  </div>
               </div>
            )}
            
            {isActive && transcript.length === 1 && !liveText && (
               <div className="flex flex-col items-center justify-center py-20 opacity-30">
                  <div className="flex gap-1 mb-4 h-8 items-end">
                    <div className="w-1 bg-blue-500 animate-[wave_1s_ease-in-out_infinite] h-4"></div>
                    <div className="w-1 bg-blue-500 animate-[wave_1s_ease-in-out_infinite_0.1s] h-8"></div>
                    <div className="w-1 bg-blue-500 animate-[wave_1s_ease-in-out_infinite_0.2s] h-6"></div>
                    <div className="w-1 bg-blue-500 animate-[wave_1s_ease-in-out_infinite_0.3s] h-4"></div>
                  </div>
                  <p className="text-xs uppercase font-bold tracking-widest text-center max-w-[200px]">Waiting for voice activity...</p>
               </div>
            )}
          </div>

          <div className="p-4 bg-slate-950/80 backdrop-blur-md border-t border-slate-800 z-10">
            <div className="grid grid-cols-2 gap-3 mb-4">
               <button 
                 onClick={toggleListening}
                 disabled={!isActive}
                 className={`py-3 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                   isListening 
                    ? 'bg-red-500 text-white shadow-lg shadow-red-500/20 animate-pulse' 
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700'
                 } disabled:opacity-20`}
               >
                 <i className={`fas ${isListening ? 'fa-microphone-slash' : 'fa-microphone'}`}></i>
                 {isListening ? 'End Session' : 'Start Listening'}
               </button>
               <button 
                 onClick={triggerDemoScam}
                 disabled={!isActive || isListening}
                 className="py-3 px-3 bg-blue-600/10 text-blue-400 border border-blue-600/20 rounded-xl text-xs font-bold hover:bg-blue-600/20 transition-all disabled:opacity-20 flex items-center justify-center gap-2"
               >
                 <i className="fas fa-play-circle"></i> Inject Scam Demo
               </button>
            </div>
          </div>
        </div>
      </main>

      {isAlerting && (
        <div className="fixed inset-0 bg-red-600/20 backdrop-blur-sm pointer-events-none z-[100] animate-pulse flex flex-col items-center justify-center overflow-hidden">
          <div className="bg-red-600 text-white px-10 py-5 rounded-3xl font-black text-3xl shadow-[0_0_50px_rgba(239,68,68,0.5)] flex flex-col items-center gap-4 animate-bounce border-4 border-white/20">
            <i className="fas fa-shield-virus text-6xl"></i>
            <span>SCAM DETECTED!</span>
            <span className="text-sm font-bold opacity-80 uppercase tracking-widest">Active Intervention Protocol</span>
          </div>
        </div>
      )}

      <style>{`
        @keyframes wave {
          0%, 100% { height: 10px; }
          50% { height: 32px; }
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(59, 130, 246, 0.2);
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
};

export default App;
