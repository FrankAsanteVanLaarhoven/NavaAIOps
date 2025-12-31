'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FaceScanner } from '@/lib/biometrics/face-scan';
import { PalmDisplay } from '@/components/visual/palm-display';
import { cn } from '@/lib/utils';
import { Scan, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function BiometricLogin() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [user, setUser] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [faceMetrics, setFaceMetrics] = useState<any[]>([]);

  const mockUser = {
    id: '1',
    name: 'Commander Shepard',
    role: 'Ops Intelligence',
    avatar: 'https://i.pravatar.cc/150?u=a042581f4b28012008b9',
  };

  const handleFaceEnrollment = (metrics: any[]) => {
    setFaceMetrics(metrics);
    setStep(2);
  };

  const handleNextStep = () => {
    if (step < 4) {
      setStep((prev) => (prev + 1) as 1 | 2 | 3 | 4);
    }
  };

  const handleNavaFlowLogin = async () => {
    console.log('Authenticating with Nava AI OPS...');
    setTimeout(() => {
      setIsAuthenticated(true);
      setUser(mockUser);
      setStep(4);
    }, 1000);
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[#050505]">
      {step === 1 && (
        <div className="w-full max-w-4xl">
          <FaceScanner 
            userId="demo-user" 
            onEnrollmentComplete={handleFaceEnrollment}
          />
        </div>
      )}

      {step === 2 && (
        <div className="w-full h-screen">
          <PalmDisplay />
          <div className="absolute bottom-8 right-8 z-30">
            <Button
              onClick={handleNextStep}
              className="bg-[#00ffcc] hover:bg-[#00ddee] text-white px-8 py-3 rounded-lg shadow-lg"
            >
              NEXT: BIO-METRICS
            </Button>
          </div>
        </div>
      )}

      {step >= 3 && (
        <Card className="w-[600px] border-[#1a1a1f]/50 shadow-2xl bg-[#050505]/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <span className="text-2xl">🔐</span>
              <span className="text-2xl font-bold tracking-tight">Nava AI OPS INTELLIGENCE</span>
            </CardTitle>
          </CardHeader>
          
          <CardContent>
            {/* Progress Bar */}
            <div className="w-full bg-slate-800 rounded-full h-2 mb-6 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-[#00ffcc] to-[#00ddee] transition-all duration-1000 ease-out"
                style={{ width: `${(step / 4) * 100}%` }}
              ></div>
            </div>

            {/* Step 1: Face ID */}
            <div className={cn("transition-all duration-500 mb-8", step >= 2 ? "opacity-50" : "opacity-100")}>
              <div className="flex flex-col items-center gap-4">
                <div className={cn("w-12 h-12 rounded-full flex items-center justify-center transition-colors", {
                  "bg-green-500": step > 1,
                  "bg-slate-700": step === 1
                })}>
                  {step > 1 ? (
                    <CheckCircle2 className="w-6 h-6 text-white" />
                  ) : (
                    <Scan className="w-6 h-6 text-white" />
                  )}
                </div>
                <div className="text-center">
                  <h3 className="text-lg font-bold text-white">STEP 1: FACE ID</h3>
                  <p className="text-sm text-slate-300">
                    {step > 1 ? "Face ID verified. Captured 128 landmarks." : "Align your face within the frame."}
                  </p>
                </div>
              </div>
            </div>

            {/* Step 2: Palm Scan */}
            <div className={cn("transition-all duration-500 mb-8", step >= 3 ? "opacity-50" : "opacity-100")}>
              <div className="flex flex-col items-center gap-4">
                <div className={cn("w-12 h-12 rounded-full flex items-center justify-center transition-colors", {
                  "bg-green-500": step > 2,
                  "bg-slate-700": step === 2
                })}>
                  {step > 2 ? (
                    <CheckCircle2 className="w-6 h-6 text-white" />
                  ) : (
                    <Scan className="w-6 h-6 text-white animate-spin" />
                  )}
                </div>
                <div className="text-center">
                  <h3 className="text-lg font-bold text-white">STEP 2: PALM PRINT</h3>
                  <p className="text-sm text-slate-300">
                    {step > 2 ? "Palm geometry captured. Vein pattern verified." : "Place your hand on the scanner."}
                  </p>
                </div>
              </div>
            </div>

            {/* Step 3: Bio-Metrics */}
            <div className={cn("transition-all duration-500 mb-8", step >= 4 ? "opacity-50" : "opacity-100")}>
              <div className="flex flex-col items-center gap-4">
                <div className={cn("w-12 h-12 rounded-full flex items-center justify-center transition-colors", {
                  "bg-green-500": step > 3,
                  "bg-slate-700": step === 3
                })}>
                  {step > 3 ? (
                    <CheckCircle2 className="w-6 h-6 text-white" />
                  ) : (
                    <span className="text-2xl">📊</span>
                  )}
                </div>
                <div className="text-center">
                  <h3 className="text-lg font-bold text-white">STEP 3: BIO-METRICS</h3>
                  <p className="text-sm text-slate-300">
                    {step > 3 ? "Metrics saved to encrypted storage." : "Analyzing captured data..."}
                  </p>
                </div>
                {step === 3 && (
                  <Button 
                    onClick={handleNavaFlowLogin} 
                    className="mt-4 bg-white text-slate-900 hover:bg-slate-50"
                  >
                    FINALIZE
                  </Button>
                )}
              </div>
            </div>

            {/* Step 4: Nava AI OPS Login */}
            {step === 4 && (
              <div className="transition-all duration-500">
                {isAuthenticated ? (
                  <div className="flex flex-col items-center gap-6">
                    <div className="w-20 h-20 rounded-full border-2 border-slate-200 bg-white overflow-hidden">
                      <img src={user.avatar} alt="User Avatar" className="w-full h-full object-cover" />
                    </div>
                    <div className="text-center">
                      <h3 className="text-xl font-bold text-white">{user.name}</h3>
                      <p className="text-sm text-slate-300">{user.role}</p>
                    </div>
                    <div className="text-center text-slate-400 text-sm">
                      <p>Welcome back, <span className="font-bold text-[#00ffcc]">{user.name}</span>.</p>
                      <p>Nava AI OPS Systems are operational.</p>
                      <p className="text-xs mt-2">Authenticated via: Face ID + Palm Geometry</p>
                    </div>
                    <Button 
                      onClick={() => router.push('/dashboard')} 
                      className="mt-6 bg-[#00ffcc] hover:bg-[#00ddee] text-white px-8 py-3 rounded-lg shadow-lg"
                    >
                      LAUNCH DASHBOARD
                    </Button>
                  </div>
                ) : (
                  <div className="w-full text-center">
                    <h3 className="text-xl font-bold text-white">AUTHENTICATING WITH NAVA AI...</h3>
                    <div className="mt-4 flex justify-center">
                      <div className="w-12 h-12 rounded-full border-4 border-slate-800 bg-slate-900 flex items-center justify-center">
                        <Scan className="w-6 h-6 text-white animate-spin" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
