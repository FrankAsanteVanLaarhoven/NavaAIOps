'use client';

import { useView } from '@/app/state/view-context';
import { Button } from '@/components/ui/button';
import { Sparkles, Zap, MessageSquare, Users } from 'lucide-react';

export function OnboardingView() {
  const { navigateToMainChat } = useView();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-gradient-to-b from-background to-muted/20">
      <div className="max-w-4xl w-full space-y-12">
        {/* Hero Section */}
        <div className="text-center space-y-6">
          <div className="flex items-center justify-center gap-3">
            <Sparkles className="w-12 h-12 text-violet-500" />
            <h1 className="text-5xl font-bold bg-gradient-to-r from-violet-500 to-fuchsia-500 bg-clip-text text-transparent">
              NavaFlow
            </h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            The next-generation team communication platform. Faster than Slack, smarter than X.
          </p>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6">
          <div className="p-6 border rounded-lg space-y-3">
            <Zap className="w-8 h-8 text-violet-500" />
            <h3 className="font-semibold text-lg">Instant Mode</h3>
            <p className="text-sm text-muted-foreground">
              Switch between channels and threads instantly. No page reloads, no waiting.
            </p>
          </div>
          <div className="p-6 border rounded-lg space-y-3">
            <Sparkles className="w-8 h-8 text-fuchsia-500" />
            <h3 className="font-semibold text-lg">AI-Powered</h3>
            <p className="text-sm text-muted-foreground">
              Thread summarization and smart compose assistance built right in.
            </p>
          </div>
          <div className="p-6 border rounded-lg space-y-3">
            <MessageSquare className="w-8 h-8 text-violet-500" />
            <h3 className="font-semibold text-lg">Unified Experience</h3>
            <p className="text-sm text-muted-foreground">
              Single-page application that feels like a desktop app in your browser.
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center space-y-4">
          <Button
            size="lg"
            className="bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white hover:from-violet-600 hover:to-fuchsia-600"
            onClick={() => navigateToMainChat()}
          >
            Get Started
          </Button>
          <p className="text-sm text-muted-foreground">
            No sign-up required. Try it now.
          </p>
        </div>
      </div>
    </div>
  );
}
