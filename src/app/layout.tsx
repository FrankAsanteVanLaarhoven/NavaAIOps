import type { Metadata } from "next";
import { Geist, Geist_Mono, Rajdhani } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const rajdhani = Rajdhani({
  variable: "--font-rajdhani",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "NavaFlow - Developer's Operating System",
  description: "NavaFlow: The SOTA competitor to X and Slack. Real-time collaboration, AI-powered features, and developer-centric workflows.",
  keywords: ["NavaFlow", "TypeScript", "Tailwind CSS", "shadcn/ui", "AI development", "React", "Developer Tools", "Real-time Collaboration"],
  authors: [{ name: "NavaFlow Team" }],
  openGraph: {
    title: "NavaFlow - Developer's Operating System",
    description: "SOTA competitor to X and Slack. Real-time collaboration, AI-powered features, and developer-centric workflows.",
    url: "https://navaflow.com",
    siteName: "NavaFlow",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "NavaFlow - Developer's Operating System",
    description: "SOTA competitor to X and Slack. Real-time collaboration, AI-powered features, and developer-centric workflows.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Remove Next.js default favicon and use custom icon */}
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="icon" href="/favicon.ico" type="image/x-icon" sizes="any" />
        <link rel="apple-touch-icon" href="/icon.svg" />
        {/* Hide Next.js powered by header */}
        <meta name="next-head-count" content="0" />
        {/* Suppress React DevTools message - must run before React loads */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                // Suppress React DevTools download message - must run before React loads
                const originalLog = console.log;
                const originalInfo = console.info;
                const originalWarn = console.warn;
                
                console.log = function(...args) {
                  const message = args.join(' ');
                  if (message.includes('Download the React DevTools') || 
                      message.includes('react.dev/link/react-devtools') ||
                      message.includes('React DevTools')) {
                    return; // Suppress React DevTools message
                  }
                  originalLog.apply(console, args);
                };
                
                console.info = function(...args) {
                  const message = args.join(' ');
                  if (message.includes('Download the React DevTools') || 
                      message.includes('react.dev/link/react-devtools') ||
                      message.includes('React DevTools')) {
                    return; // Suppress React DevTools message
                  }
                  originalInfo.apply(console, args);
                };
                
                console.warn = function(...args) {
                  const message = args.join(' ');
                  if (message.includes('Download the React DevTools') || 
                      message.includes('react.dev/link/react-devtools') ||
                      message.includes('React DevTools')) {
                    return; // Suppress React DevTools message
                  }
                  originalWarn.apply(console, args);
                };
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${rajdhani.variable} antialiased bg-background text-foreground`}
      >
        <noscript>
          <div style={{ padding: '20px', textAlign: 'center' }}>
            <h1>NavaFlow</h1>
            <p>JavaScript is required to run this application.</p>
          </div>
        </noscript>
        <div id="app-root" style={{ minHeight: '100vh', visibility: 'visible', opacity: 1 }}>
          {children}
        </div>
        <Toaster />
        {/* Script to remove any Next.js branding from DOM and handle connection errors */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                // Suppress React DevTools download message - must run before React loads
                const suppressReactDevToolsMessage = () => {
                  const originalLog = console.log;
                  const originalInfo = console.info;
                  const originalWarn = console.warn;
                  
                  console.log = function(...args) {
                    const message = args.join(' ');
                    if (message.includes('Download the React DevTools') || 
                        message.includes('react.dev/link/react-devtools') ||
                        message.includes('React DevTools')) {
                      return;
                    }
                    originalLog.apply(console, args);
                  };
                  
                  console.info = function(...args) {
                    const message = args.join(' ');
                    if (message.includes('Download the React DevTools') || 
                        message.includes('react.dev/link/react-devtools') ||
                        message.includes('React DevTools')) {
                      return;
                    }
                    originalInfo.apply(console, args);
                  };
                  
                  console.warn = function(...args) {
                    const message = args.join(' ');
                    if (message.includes('Download the React DevTools') || 
                        message.includes('react.dev/link/react-devtools') ||
                        message.includes('React DevTools')) {
                      return;
                    }
                    originalWarn.apply(console, args);
                  };
                };
                
                suppressReactDevToolsMessage();

                // Global error handler to catch and suppress "Connection closed" errors silently
                const originalError = window.onerror;
                window.onerror = function(msg, url, line, col, error) {
                  if (typeof msg === 'string' && (
                    msg.includes('Connection closed') ||
                    msg.includes('connection closed') ||
                    (error && error.message && error.message.includes('Connection closed'))
                  )) {
                    return true;
                  }
                  if (originalError) {
                    return originalError.call(this, msg, url, line, col, error);
                  }
                  return false;
                };

                // Handle unhandled promise rejections
                window.addEventListener('unhandledrejection', function(event) {
                  if (event.reason && (
                    (typeof event.reason === 'string' && event.reason.includes('Connection closed')) ||
                    (event.reason.message && event.reason.message.includes('Connection closed'))
                  )) {
                    event.preventDefault();
                  }
                });

                // Wait for React to hydrate before doing any DOM manipulation
                window.addEventListener('load', function() {
                  setTimeout(function() {
                    try {
                      if (document.body) {
                        document.body.classList.add('loaded');
                      }
                    } catch (e) {
                      // Ignore
                    }
                  }, 500);
                });
              })();
            `,
          }}
        />
      </body>
    </html>
  );
}
