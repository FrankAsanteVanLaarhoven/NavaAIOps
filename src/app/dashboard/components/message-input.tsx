'use client';

import { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Send, StopCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTheme } from '@/hooks/use-theme';

export function MessageInput() {
  const { theme } = useTheme();
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [simulationMode, setSimulationMode] = useState(false); // Simulation Toggle for Demo
  const recognitionRef = useRef<any>(null);

  // Mock Voice Recognition (Web Speech API)
  const startListening = async () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Browser not supported');
      return;
    }
    
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event: any) => {
      const current = event.resultIndex;
      const transcriptText = event.results[current][0].transcript;
      setTranscript(transcriptText);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };

    recognition.start();
    recognitionRef.current = recognition;
    setIsListening(true);
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  return (
    <div className="relative w-full h-full bg-transparent">
      {/* VOICE FEEDBACK VISUALIZER */}
      {isListening && (
        <div className="absolute inset-0 pointer-events-none z-50">
          <div className={cn("flex items-center justify-center h-full w-full backdrop-blur-md rounded-xl", {
            "bg-slate-900/10": theme === 'light',
            "bg-slate-900/50": theme === 'dark-plus'
          })}>
            <div className="flex flex-col items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
              <p className={cn("text-xs font-bold font-sci-fi", {
                "text-slate-900": theme === 'light',
                "text-white": theme === 'dark-plus'
              })}>
                LISTENING...
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="p-4">
        <textarea
          placeholder="Type your message or use Voice..."
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          className={cn(
            "w-full h-24 rounded-xl border-2 focus:outline-none focus:ring-2 focus:ring-cyan-500 p-4 text-lg resize-none transition-all",
            theme === 'light' 
              ? "bg-white/50 text-slate-900 placeholder-slate-400 border-slate-300 focus:text-slate-900" 
              : "bg-[#050505] placeholder-slate-600 focus:text-slate-100 border-slate-700"
          )}
        />

        <div className="flex items-center gap-4 mt-2">
          {/* SPEAK BUTTON */}
          <button
            type="button"
            onClick={isListening ? stopListening : startListening}
            className={cn("w-12 h-12 rounded-xl border flex items-center justify-center gap-2 transition-all", {
              "bg-cyan-600 hover:bg-cyan-700 text-white border-cyan-600": theme === 'light',
              "bg-[#050505] hover:bg-slate-800 text-slate-200 border-slate-700": theme === 'dark-plus'
            })}
          >
            <Mic className={cn("w-5 h-5", {
              "animate-pulse": isListening
            })} />
            <span className={cn("text-xs font-bold ml-1", {
              "text-white": theme === 'light',
              "text-slate-200": theme === 'dark-plus'
            })}>
              {isListening ? "SPEAKING" : "SPEAK"}
            </span>
          </button>

          {/* SIMULATION TOGGLE */}
          <button 
            type="button"
            onClick={() => setSimulationMode(!simulationMode)}
            className={cn("text-xs font-medium transition-colors", {
              "text-slate-400 hover:text-slate-600": theme === 'light',
              "text-slate-500 hover:text-slate-300": theme === 'dark-plus',
              "text-cyan-600": simulationMode && theme === 'light',
              "text-cyan-400": simulationMode && theme === 'dark-plus'
            })}
          >
            {simulationMode ? 'Stop Sim' : 'Sim AI'}
          </button>

          {/* SEND BUTTON */}
          <Button 
            className="ml-auto px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-medium transition-all text-sm flex items-center gap-2"
            onClick={() => {
              if (transcript.trim()) {
                console.log('Sending message:', transcript);
                alert(`Message sent: ${transcript}`);
                setTranscript('');
              } else {
                alert('Please enter a message or use voice input');
              }
            }}
          >
            <Send className="w-4 h-4" />
            <span>Send</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
