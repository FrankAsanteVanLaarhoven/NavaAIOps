'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { 
  Shield, 
  Scan, 
  Mic, 
  Globe, 
  Clock, 
  Activity, 
  Terminal, 
  Play, 
  Zap, 
  ArrowRight, 
  X, 
  CheckCircle, 
  XCircle, 
  Calendar,
  Cloud,
  Brain,
  Github
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardDescription, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

// --- Mock Data for "Bio-Metrics" & Weather ---
const SYSTEM_TIME = new Date().toISOString();
const WEATHER_CONDITION = 'OPTIMAL'; // Mock for "Space Ops"

export default function SplashPage() {
  const router = useRouter();
  const [isScanning, setIsScanning] = useState(false);
  const [biometricType, setBiometricType] = useState<'face' | 'palm' | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [lang, setLang] = useState<'en' | 'fr' | 'de' | 'jp' | 'zh'>('en');
  
  // Audio Context for Futuristic Sounds
  const audioContext = useRef<AudioContext | null>(null);

  // Play "Scan" Sound
  const playScanSound = () => {
    if (!audioContext.current) {
      // Initialize Audio Context (lazy load)
      const AudioContext = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;

      audioContext.current = new AudioContext();
    }
    
    // Create Oscillator (Sine wave for sci-fi "beep")
    const oscillator = audioContext.current.createOscillator();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(800, audioContext.current.currentTime); // High pitch for "Sci-Fi" scan
    const gainNode = audioContext.current.createGain();
    gainNode.gain.setValueAtTime(0.1, audioContext.current.currentTime); // Low volume

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.current.destination);
    
    oscillator.start();
    setTimeout(() => {
      oscillator.stop();
      gainNode.disconnect();
    }, 300); // 300ms beep
  };

  // Play "Accept" Sound (Futuristic "Chord")
  const playAcceptSound = () => {
    if (!audioContext.current) return;
    
    const osc = audioContext.current.createOscillator();
    osc.type = 'triangle'; // Harsher sound
    osc.frequency.setValueAtTime(220, audioContext.current.currentTime); // A3 note
    const gain = audioContext.current.createGain();
    gain.gain.setValueAtTime(0.2, audioContext.current.currentTime);
    
    osc.connect(gain);
    gain.connect(audioContext.current.destination);
    
    osc.start();
    setTimeout(() => {
      osc.stop();
      gain.disconnect();
    }, 400); // Longer "Chord"
  };

  // Play "Deny" Sound (Low "Buzz")
  const playDenySound = () => {
    if (!audioContext.current) return;
    const osc = audioContext.current.createOscillator();
    osc.type = 'sawtooth'; // Rougher sound
    osc.frequency.setValueAtTime(100, audioContext.current.currentTime); // Low buzz
    const gain = audioContext.current.createGain();
    gain.gain.setValueAtTime(0.3, audioContext.current.currentTime);
    
    osc.connect(gain);
    gain.connect(audioContext.current.destination);
    
    osc.start();
    setTimeout(() => {
      osc.stop();
      gain.disconnect();
    }, 200); // Short buzz
  };

  const startScan = (type: 'face' | 'palm') => {
    setBiometricType(type);
    setIsScanning(true);
    playScanSound(); // Play Sound

    // Simulate Scan Process (3s)
    setTimeout(() => {
      setIsScanning(false);
      playAcceptSound(); // Play "Access Granted"
      // Route to dashboard after successful scan
      setTimeout(() => {
        router.push('/dashboard');
      }, 500);
    }, 3000);
  };

  // Weather Widget Data
  const weatherData = [
    { label: 'Humidity', value: '45%' },
    { label: 'Temp', value: '21°C' },
    { label: 'Visibility', value: '98%' },
  ];

  return (
    <div className={cn("min-h-screen w-full relative overflow-hidden flex flex-col", {
      "bg-white": theme === 'light',
      "bg-[#050505]": theme === 'dark' // Deep Space Black
    })}>
      
      {/* --- BACKGROUND IMAGE --- */}
      {/* Using a high-quality Unsplash image of a futuristic server room */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-15188794531-4b0b0f3a8e8b2c6d3e2f78c5b5bd620?auto=format&fit=crop&w=2880&q=80" 
          alt="NavaFlow Future Ops Center"
          className="w-full h-full object-cover"
          style={{ filter: 'brightness(0.3) contrast(1.2)' }} // Dimmed for better text readability
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-slate-900/30 to-transparent"></div> {/* Gradient Overlay */}
      </div>

      {/* --- HUD / BIOMETRICS (TOP BAR) --- */}
      <div className="absolute top-0 left-0 right-0 w-full z-20 px-4 py-2 flex items-center justify-between glass-panel">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-900 via-slate-700 to-slate-600 flex items-center justify-center border border-slate-800/20">
            <span className={cn("text-2xl font-bold font-cinematic tracking-tight", {
              "text-white": theme === 'light',
              "text-slate-100": theme === 'dark'
            })}>
              NAVA
            </span>
          </div>
          <div className={cn("flex flex-col", {
            "text-slate-700": theme === 'light',
            "text-slate-300": theme === 'dark'
          })}>
            <span className={cn("text-sm font-medium", {
              "text-cyan-500": theme === 'light', // Neon Cyan
              "text-slate-400": theme === 'dark'
            })}>
              FLOW
            </span>
            <span className="text-xs text-slate-500 tracking-widest">OPS INTELLIGENCE</span>
          </div>
        </div>

        {/* Right Side: Time, Weather, Language */}
        <div className="flex items-center gap-4">
          {/* Clock (System Time) */}
          <div className={cn("flex flex-col items-center gap-1 px-3 py-1 rounded-full border", {
            "border-slate-200 bg-slate-50": theme === 'light',
            "border-slate-700 bg-slate-800/50": theme === 'dark'
          })}>
            <Clock className={cn("w-4 h-4", {
              "text-slate-600": theme === 'light',
              "text-slate-400": theme === 'dark'
            })} />
            <span className={cn("text-xs font-mono font-bold", {
              "text-slate-500": theme === 'light',
              "text-slate-400": theme === 'dark'
            })}>{new Date().toLocaleDateString()}</span>
          </div>

          {/* Weather Widget (Mock) */}
          <div className={cn("flex flex-col items-center gap-1 px-3 py-1 rounded-full border", {
            "border-slate-200 bg-slate-50": theme === 'light',
            "border-slate-700 bg-slate-800/50": theme === 'dark'
          })}>
            <Cloud className={cn("w-4 h-4", {
              "text-slate-600": theme === 'light',
              "text-slate-400": theme === 'dark'
            })} />
            <div className="flex flex-col">
              <span className={cn("text-xs font-bold uppercase", {
                "text-slate-500": theme === 'light',
                "text-slate-400": theme === 'dark'
              })}>TEMP</span>
              <span className={cn("text-sm font-medium", {
                "text-slate-900": theme === 'light',
                "text-slate-200": theme === 'dark'
              })}>{WEATHER_CONDITION} <span className={cn("text-xs", {
                "text-slate-500": theme === 'light',
                "text-slate-400": theme === 'dark'
              })}>SPACE OPS</span></span>
            </div>
          </div>

          {/* Language Selector */}
          <select 
            value={lang} 
            onChange={(e) => setLang(e.target.value as typeof lang)}
            className={cn("bg-transparent text-sm font-medium focus:outline-none cursor-pointer", {
              "text-slate-700": theme === 'light',
              "text-slate-300": theme === 'dark'
            })}
          >
            <option value="en">English</option>
            <option value="fr">Français</option>
            <option value="de">Deutsch</option>
            <option value="jp">日本語</option>
            <option value="zh">中文</option>
          </select>
        </div>
      </div>

      {/* --- MAIN CONTENT (HERO + GRID) --- */}
      <main className="flex-1 relative min-h-0 flex flex-col overflow-y-auto z-10 pb-20">
        
        {/* Hero Section */}
        <section className="relative w-full h-[60vh] flex flex-col justify-center items-center p-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="text-center max-w-4xl"
          >
            <h1 className={cn("text-6xl md:text-7xl font-bold mb-4 font-cinematic tracking-tight", {
              "text-slate-900": theme === 'light',
              "text-white": theme === 'dark'
            })}>
              IRONCLAD.
            </h1>
            <h2 className={cn("text-xl md:text-2xl font-cinematic mb-8", {
              "text-slate-700": theme === 'light',
              "text-slate-300": theme === 'dark'
            })}>
              Safe. Secure. Instant.
            </h2>
            
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className={cn("max-w-2xl mx-auto mb-12", {
                "text-slate-600": theme === 'light',
                "text-slate-400": theme === 'dark'
              })}
            >
              Explore the Dashboard.
            </motion.p>

            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.8 }}
            >
              <Button 
                size="lg" 
                onClick={() => router.push('/dashboard')}
                className={cn(
                  "border-2 shadow-[0_0_10px_rgba(0,0,0,0.1)] hover:shadow-[0_0_20px_rgba(0,255,204,0.2)] transition-all",
                  theme === 'light' 
                    ? "bg-white text-slate-900 hover:bg-slate-50 border-slate-800" 
                    : "bg-[#141416] text-white hover:bg-slate-800 border-slate-700"
                )}
              >
                Launch Dashboard
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </motion.div>
          </motion.div>
        </section>
      </main>

      {/* --- INTERACTIVE WIDGETS (BOTTOM) --- */}
      <div className="absolute bottom-0 left-0 right-0 w-full z-20 px-6 py-6 flex flex-col items-end gap-6">
        
        {/* Widget 1: Voice Control */}
        <div className="glass-panel p-4 rounded-2xl flex flex-col gap-3 max-w-sm w-full">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Mic className={cn("w-5 h-5", {
                "text-slate-600": theme === 'light',
                "text-slate-300": theme === 'dark'
              })} />
              <span className={cn("text-sm font-medium", {
                "text-slate-500": theme === 'light',
                "text-slate-400": theme === 'dark'
              })}>VOICE COMMAND</span>
            </div>
            <button className={cn("text-xs", {
              "text-slate-400 hover:text-slate-600": theme === 'light',
              "text-slate-500 hover:text-slate-300": theme === 'dark'
            })}>SETTINGS</button>
          </div>
          
          {/* Waveform Visualizer (Simulated) */}
          <div className={cn("h-16 w-full rounded-lg relative overflow-hidden", {
            "bg-slate-900": theme === 'light',
            "bg-slate-950": theme === 'dark'
          })}>
            {isScanning && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                <div className="w-1 h-8 bg-green-500 rounded-full animate-pulse"></div> {/* Scanning Light */}
              </div>
            )}
            <div className="flex items-end justify-center h-full gap-1">
              {[1,2,3,4,5].map((i) => (
                <div key={i} className={cn("w-2 rounded-full", {
                  "bg-slate-600": theme === 'light' && i < 3,
                  "bg-slate-400": theme === 'light' && i >= 3,
                  "bg-slate-800": theme === 'dark' && i < 3,
                  "bg-slate-700": theme === 'dark' && i >= 3,
                  "h-4": i % 2 === 0,
                  "h-6": i % 2 === 1
                })}></div>
              ))}
            </div>
          </div>
        </div>

        {/* Widget 2: Biometrics / Login */}
        <div className="glass-panel p-4 rounded-2xl flex flex-col gap-4 max-w-sm w-full">
          <CardTitle className={cn("font-cinematic", {
            "text-slate-900": theme === 'light',
            "text-slate-100": theme === 'dark'
          })}>IDENTITY VERIFICATION</CardTitle>
          
          <div className="grid grid-cols-2 gap-4">
            {/* Face Scan */}
            <motion.button
              type="button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => startScan('face')}
              disabled={isScanning}
              className={cn("p-6 rounded-xl border-2 flex flex-col items-center justify-center transition-all", {
                "bg-white hover:bg-slate-50 hover:border-slate-300 border-slate-200": theme === 'light',
                "bg-slate-800 hover:bg-slate-700 hover:border-slate-700 border-slate-700": theme === 'dark',
                "opacity-50 cursor-not-allowed": isScanning
              })}
            >
              <Scan className={cn("w-12 h-12 mb-3", {
                "text-slate-600": theme === 'light',
                "text-slate-300": theme === 'dark'
              })} />
              <span className={cn("font-medium", {
                "text-slate-900": theme === 'light',
                "text-slate-100": theme === 'dark'
              })}>
                FACE SCAN
              </span>
              {isScanning && biometricType === 'face' && (
                <span className={cn("text-xs animate-pulse", {
                  "text-slate-500": theme === 'light',
                  "text-slate-400": theme === 'dark'
                })}>SCANNING...</span>
              )}
            </motion.button>

            {/* Palm Scan */}
            <motion.button
              type="button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => startScan('palm')}
              disabled={isScanning}
              className={cn("p-6 rounded-xl border-2 flex flex-col items-center justify-center transition-all", {
                "bg-white hover:bg-slate-50 hover:border-slate-300 border-slate-200": theme === 'light',
                "bg-slate-800 hover:bg-slate-700 hover:border-slate-700 border-slate-700": theme === 'dark',
                "opacity-50 cursor-not-allowed": isScanning
              })}
            >
              <Activity className={cn("w-12 h-12 mb-3", {
                "text-slate-600": theme === 'light',
                "text-slate-300": theme === 'dark'
              })} />
              <span className={cn("font-medium", {
                "text-slate-900": theme === 'light',
                "text-slate-100": theme === 'dark'
              })}>
                PALM SCAN
              </span>
              {isScanning && biometricType === 'palm' && (
                <span className={cn("text-xs animate-pulse", {
                  "text-slate-500": theme === 'light',
                  "text-slate-400": theme === 'dark'
                })}>SCANNING...</span>
              )}
            </motion.button>
          </div>
          
          {/* Status Indicators */}
          <div className="mt-4 flex items-center gap-2">
            {isScanning ? (
              <div className={cn("flex items-center gap-2 text-xs", {
                "text-slate-400": theme === 'light',
                "text-slate-500": theme === 'dark'
              })}>
                <Activity className="w-3 h-3 animate-spin" />
                SYSTEM ANALYSIS...
              </div>
            ) : (
              <div className={cn("flex items-center gap-2 text-xs", {
                "text-slate-400": theme === 'light',
                "text-slate-500": theme === 'dark'
              })}>
                <CheckCircle className="w-3 h-3 text-green-500" />
                IDLE
              </div>
            )}
          </div>
        </div>

        {/* Widget 3: Capabilities (Advertising) */}
        <div className="glass-panel p-4 rounded-2xl flex-1 flex-col gap-4 max-w-md w-full">
          <CardTitle className={cn("font-cinematic", {
            "text-slate-900": theme === 'light',
            "text-slate-100": theme === 'dark'
          })}>CAPABILITIES</CardTitle>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Speed */}
            <div className={cn("p-4 rounded-xl border", {
              "bg-slate-50/50 border-slate-200": theme === 'light',
              "bg-slate-800/50 border-slate-700": theme === 'dark'
            })}>
              <div className="flex items-center justify-between mb-2">
                <Zap className={cn("w-8 h-8", {
                  "text-slate-600": theme === 'light',
                  "text-slate-300": theme === 'dark'
                })} />
                <span className={cn("text-xs font-bold uppercase", {
                  "text-slate-900": theme === 'light',
                  "text-slate-100": theme === 'dark'
                })}>SPEED</span>
              </div>
              <div className={cn("text-2xl font-bold", {
                "text-slate-900": theme === 'light',
                "text-white": theme === 'dark'
              })}>0.15 ms</div>
              <p className={cn("text-sm", {
                "text-slate-600": theme === 'light',
                "text-slate-400": theme === 'dark'
              })}>Ironclad Loop Latency</p>
            </div>
            
            {/* Intelligence */}
            <div className={cn("p-4 rounded-xl border", {
              "bg-slate-50/50 border-slate-200": theme === 'light',
              "bg-slate-800/50 border-slate-700": theme === 'dark'
            })}>
              <div className="flex items-center justify-between mb-2">
                <Brain className={cn("w-8 h-8", {
                  "text-slate-600": theme === 'light',
                  "text-slate-300": theme === 'dark'
                })} />
                <span className={cn("text-xs font-bold uppercase", {
                  "text-slate-900": theme === 'light',
                  "text-slate-100": theme === 'dark'
                })}>RDKD</span>
              </div>
              <div className={cn("text-2xl font-bold", {
                "text-slate-900": theme === 'light',
                "text-white": theme === 'dark'
              })}>INSTANT</div>
              <p className={cn("text-sm", {
                "text-slate-600": theme === 'light',
                "text-slate-400": theme === 'dark'
              })}>Recursive Differential Knowledge Distillation</p>
            </div>

            {/* Safety */}
            <div className={cn("p-4 rounded-xl border", {
              "bg-slate-50/50 border-slate-200": theme === 'light',
              "bg-slate-800/50 border-slate-700": theme === 'dark'
            })}>
              <div className="flex items-center justify-between mb-2">
                <Shield className={cn("w-8 h-8", {
                  "text-slate-600": theme === 'light',
                  "text-slate-300": theme === 'dark'
                })} />
                <span className={cn("text-xs font-bold uppercase", {
                  "text-slate-900": theme === 'light',
                  "text-slate-100": theme === 'dark'
                })}>CMDP</span>
              </div>
              <div className={cn("text-2xl font-bold", {
                "text-slate-900": theme === 'light',
                "text-white": theme === 'dark'
              })}>99.9%</div>
              <p className={cn("text-sm", {
                "text-slate-600": theme === 'light',
                "text-slate-400": theme === 'dark'
              })}>Compliance Score (Safety)</p>
            </div>
          </div>
        </div>
      </div>

      {/* --- FOOTER --- */}
      <footer className={cn("w-full p-6 border-t flex flex-col md:flex-row justify-between items-center z-30", {
        "border-slate-200 bg-slate-50/50": theme === 'light',
        "border-slate-800 bg-slate-900/50": theme === 'dark'
      })}>
        <div className={cn("text-sm font-cinematic", {
          "text-slate-600": theme === 'light',
          "text-slate-400": theme === 'dark'
        })}>
          &copy; 2024 NavaFlow AI Systems.
        </div>
        <div className="flex gap-4">
          <a href="#" className={cn("text-xs hover:underline", {
            "text-slate-500 hover:text-slate-600": theme === 'light',
            "text-slate-400 hover:text-slate-300": theme === 'dark'
          })}>Privacy Policy</a>
          <a href="#" className={cn("text-xs hover:underline", {
            "text-slate-500 hover:text-slate-600": theme === 'light',
            "text-slate-400 hover:text-slate-300": theme === 'dark'
          })}>Terms of Service</a>
          <a href="#" className={cn("text-xs hover:underline", {
            "text-slate-500 hover:text-slate-600": theme === 'light',
            "text-slate-400 hover:text-slate-300": theme === 'dark'
          })}>Status Page</a>
          <a href="https://github.com/navaflow" className={cn("text-xs hover:underline flex items-center gap-1", {
            "text-slate-500 hover:text-slate-600": theme === 'light',
            "text-slate-400 hover:text-slate-300": theme === 'dark'
          })}>
            <Github className="w-4 h-4" />
            GitHub
          </a>
        </div>
      </footer>
    </div>
  );
}
