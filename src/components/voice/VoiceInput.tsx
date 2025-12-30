'use client';

import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Fingerprint } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface VoiceInputProps {
  workspaceId: string;
  channelId: string;
  onIntent: (intent: { type: string; params: any }) => void;
  onText: (text: string) => void;
  isBiometricEnabled?: boolean;
}

export function VoiceInput({
  workspaceId,
  channelId,
  onIntent,
  onText,
  isBiometricEnabled = false,
}: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [confidence, setConfidence] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isBiometricLocked, setIsBiometricLocked] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        let interim = '';
        let final = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            final += transcript;
          } else {
            interim += transcript;
          }
        }

        if (interim) {
          setInterimTranscript(interim);
          if (isBiometricEnabled && !isBiometricLocked) {
            detectIntent(interim);
          }
        }

        if (final) {
          setTranscript(final);
          handleFinalTranscript(final);
          setInterimTranscript('');
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'no-speech') {
          // Ignore no-speech errors
          return;
        }
        toast({
          title: 'Voice Error',
          description: event.error,
          variant: 'destructive',
        });
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [isBiometricEnabled, isBiometricLocked]);

  const detectIntent = async (text: string) => {
    if (isProcessing) return;

    setIsProcessing(true);
    try {
      const lowerText = text.toLowerCase().trim();

      // Intent mapping
      const intentMap: Record<string, { type: string; params: any }> = {
        'open sidebar': { type: 'navigation', params: { view: 'sidebar' } },
        'close sidebar': { type: 'navigation', params: { view: 'main' } },
        'create incident': { type: 'action', params: { action: 'createIncident' } },
        'resolve incident': { type: 'action', params: { action: 'resolveIncident' } },
        'ping channel': { type: 'action', params: { action: 'ping', target: channelId } },
        'search': { type: 'action', params: { action: 'openSearch' } },
        'summarize': { type: 'action', params: { action: 'summarizeThread' } },
      };

      // Check for intent matches
      for (const [key, intent] of Object.entries(intentMap)) {
        if (lowerText.includes(key)) {
          setConfidence(0.9);
          onIntent(intent);
          toast({
            title: 'Voice Command',
            description: `Executed: ${key}`,
          });
          setIsProcessing(false);
          return;
        }
      }

      // No intent matched, treat as text
      setConfidence(0.5);
    } catch (error) {
      console.error('Intent detection failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFinalTranscript = async (text: string) => {
    if (!text.trim()) return;

    setIsProcessing(true);
    try {
      // Use OpenAI Whisper for high-fidelity transcription if available
      // For now, use the browser's transcription
      onText(text);
      toast({
        title: 'Voice Input',
        description: 'Transcription complete',
      });
    } catch (error) {
      console.error('Transcription failed:', error);
      toast({
        title: 'Error',
        description: 'Failed to process transcription',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const startListening = () => {
    if (!recognitionRef.current) {
      toast({
        title: 'Not Supported',
        description: 'Your browser does not support speech recognition',
        variant: 'destructive',
      });
      return;
    }

    setIsListening(true);
    recognitionRef.current.start();
  };

  const stopListening = async () => {
    setIsListening(false);
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    if (interimTranscript.trim()) {
      await handleFinalTranscript(interimTranscript);
    }
  };

  const toggleBiometricLock = () => {
    setIsBiometricLocked(!isBiometricLocked);
    if (!isBiometricLocked) {
      toast({
        title: 'Biometric Lock',
        description: 'Voice commands only - biometric enabled',
      });
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        onClick={isListening ? stopListening : startListening}
        variant={isListening ? 'destructive' : 'default'}
        className={cn('relative overflow-hidden', {
          'animate-pulse': isListening,
        })}
        size="sm"
      >
        {isListening ? (
          <MicOff className="w-4 h-4 text-red-500" />
        ) : (
          <Mic className="w-4 h-4" />
        )}
        <span className="text-xs font-medium ml-2">
          {isListening ? 'Stop' : 'Speak'}
        </span>
        {confidence > 0 && (
          <div className="absolute -top-1 -right-1 flex items-center gap-1">
            <div
              className="w-2 h-2 rounded-full bg-green-500 animate-pulse"
              style={{ animationDuration: `${1000 / confidence}ms` }}
            />
          </div>
        )}
      </Button>

      {/* Real-time transcript preview */}
      {(interimTranscript || transcript) && (
        <div className="flex-1 px-3 py-2 bg-muted rounded-lg border">
          <p className="text-sm text-muted-foreground break-all">
            {isProcessing ? (
              <span className="inline-flex gap-1">
                <span className="animate-spin">⚙</span> Processing...
              </span>
            ) : (
              interimTranscript || transcript
            )}
          </p>
        </div>
      )}

      {/* Biometric unlock button */}
      {isBiometricEnabled && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={toggleBiometricLock}
          className={cn({ 'ring-2 ring-red-500': isBiometricLocked })}
        >
          <Fingerprint className="w-3 h-3" />
          <span className="text-xs ml-1">
            {isBiometricLocked ? 'ON' : 'OFF'}
          </span>
        </Button>
      )}
    </div>
  );
}
