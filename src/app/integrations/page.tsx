'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useTheme } from '@/hooks/use-theme';
import { 
  Webhook, 
  Brain, 
  Shield, 
  Link2, 
  Database, 
  Zap,
  CheckCircle2,
  ArrowRight,
  Copy,
  ExternalLink
} from 'lucide-react';

export default function IntegrationsPage() {
  const { theme } = useTheme();
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const integrationMethods = [
    {
      id: 'api',
      title: 'API Integration',
      icon: Webhook,
      description: 'Unified tRPC Router & OpenRouter Gateway',
      color: 'cyan',
      method: 'Method 1',
    },
    {
      id: 'scraper',
      title: 'Ironclad Scraper Service',
      icon: Database,
      description: 'Deep Insights & Competitive Intelligence',
      color: 'indigo',
      method: 'Method 2',
    },
    {
      id: 'rdkd',
      title: 'RDKD (Instant Learning)',
      icon: Brain,
      description: '0.15ms Knowledge Graph Updates',
      color: 'purple',
      method: 'Method 3',
    },
    {
      id: 'blockchain',
      title: 'NavaChain (Blockchain Audit)',
      icon: Shield,
      description: 'Tamper-Proof Audit Trails',
      color: 'green',
      method: 'Method 4',
    },
    {
      id: 'holographic',
      title: 'Holographic Ops & Command Center',
      icon: Zap,
      description: 'Real-time Visual Layer',
      color: 'yellow',
      method: 'Method 5',
    },
    {
      id: 'zero-trust',
      title: 'Zero-Trust Interceptor',
      icon: Shield,
      description: 'Cyber Defense & Threat Protection',
      color: 'red',
      method: 'Method 6',
    },
  ];

  const benefits = [
    {
      feature: '0.15ms Latency (Ironclad Loop)',
      benefit: 'Sub-millisecond decision making',
      impact: 'Reduces incident resolution time from hours to seconds',
    },
    {
      feature: 'RDKD (Instant Learning)',
      benefit: 'No retraining downtime',
      impact: 'The AI adapts to new threats/policies instantly, saving thousands of dollars',
    },
    {
      feature: 'Ironclad Scraper',
      benefit: 'Competitive Intelligence',
      impact: 'Knows what competitors are doing before they do it',
    },
    {
      feature: 'NavaChain (Blockchain)',
      benefit: 'Tamper-proof audit trails',
      impact: 'Meets strict enterprise compliance (SOC2, GDPR)',
    },
    {
      feature: 'Holographic UI',
      benefit: 'Reduced cognitive load',
      impact: 'Visual interface proven to lower operator stress and fatigue',
    },
    {
      feature: 'CMDP (Safe Constraints)',
      benefit: 'Zero "Honest Mistakes"',
      impact: 'Blocks dangerous actions unless verified by a Reflexor agent',
    },
    {
      feature: 'Voice & Gesture Control',
      benefit: 'Hands-free Ops',
      impact: 'Operate the dashboard via voice and hand waves',
    },
  ];

  return (
    <div className={cn("min-h-screen p-8", {
      "bg-white": theme === 'light',
      "bg-[#141416]": theme === 'dark-plus'
    })}>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Link2 className={cn("w-8 h-8", {
              "text-slate-900": theme === 'light',
              "text-cyan-400": theme === 'dark-plus'
            })} />
            <h1 className={cn("text-4xl font-bold font-sci-fi", {
              "text-slate-900": theme === 'light',
              "text-slate-100": theme === 'dark-plus'
            })}>
              NavaFlow Integration Guide
            </h1>
          </div>
          <p className={cn("text-lg max-w-3xl", {
            "text-slate-600": theme === 'light',
            "text-slate-300": theme === 'dark-plus'
          })}>
            Connecting external companies and internal teams to <strong>NavaFlow</strong> unlocks a massive advantage: 
            turning your infrastructure from "Reactive" to <strong>Predictive</strong>, "Self-Healing," and "Audit-Verified" 
            with <strong className="text-cyan-500">0.15ms latency</strong>.
          </p>
        </div>

        {/* Integration Methods */}
        <Tabs defaultValue="api" className="space-y-6">
          <TabsList className={cn("grid grid-cols-3 lg:grid-cols-6 w-full h-auto", {
            "bg-slate-200": theme === 'light',
            "bg-slate-800": theme === 'dark-plus'
          })}>
            {integrationMethods.map((method) => (
              <TabsTrigger
                key={method.id}
                value={method.id}
                className={cn("flex flex-col items-center gap-1 p-3 text-xs", {
                  "data-[state=active]:bg-white data-[state=active]:text-slate-900": theme === 'light',
                  "data-[state=active]:bg-[#050505] data-[state=active]:text-slate-100": theme === 'dark-plus'
                })}
              >
                <method.icon className="w-5 h-5" />
                <span className="font-medium truncate w-full text-center">{method.method}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Method 1: API Integration */}
          <TabsContent value="api" className="space-y-6">
            <Card className={cn({
              "bg-white border-slate-200": theme === 'light',
              "bg-[#1e1e24] border-slate-700": theme === 'dark-plus'
            })}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Webhook className={cn("w-6 h-6", {
                    "text-cyan-600": theme === 'light',
                    "text-cyan-400": theme === 'dark-plus'
                  })} />
                  <div>
                    <CardTitle className={cn({
                      "text-slate-900": theme === 'light',
                      "text-slate-100": theme === 'dark-plus'
                    })}>
                      Method 1: API Integration (The Technical Bridge)
                    </CardTitle>
                    <CardDescription className={cn("mt-1", {
                      "text-slate-600": theme === 'light',
                      "text-slate-400": theme === 'dark-plus'
                    })}>
                      Unified tRPC Router & OpenRouter Gateway
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className={cn("p-4 rounded-lg", {
                  "bg-slate-50": theme === 'light',
                  "bg-slate-900/50": theme === 'dark-plus'
                })}>
                  <h3 className={cn("font-semibold mb-3", {
                    "text-slate-900": theme === 'light',
                    "text-slate-100": theme === 'dark-plus'
                  })}>
                    How they connect:
                  </h3>
                  <ol className={cn("list-decimal list-inside space-y-2", {
                    "text-slate-700": theme === 'light',
                    "text-slate-300": theme === 'dark-plus'
                  })}>
                    <li><strong>Authentication:</strong> They authenticate using their existing <code className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-900">API_KEY</code> (passed in headers).</li>
                    <li><strong>Webhooks:</strong> They register a URL (e.g., <code className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-900">https://api.navaflow.com/hooks</code>), and we push structured data (Incident Resolutions, Threat Scores) to them in real-time.</li>
                  </ol>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className={cn("font-semibold", {
                      "text-slate-900": theme === 'light',
                      "text-slate-100": theme === 'dark-plus'
                    })}>
                      Code Example (Partner Integration):
                    </h4>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(apiIntegrationCode, 'api-code')}
                      className="h-8"
                    >
                      {copiedCode === 'api-code' ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                  <pre className={cn("p-4 rounded-lg overflow-x-auto text-sm", {
                    "bg-slate-900 text-slate-100": theme === 'light',
                    "bg-black text-slate-300": theme === 'dark-plus'
                  })}>
                    <code>{apiIntegrationCode}</code>
                  </pre>
                </div>

                <div className={cn("p-4 rounded-lg border-l-4", {
                  "bg-cyan-50 border-cyan-500": theme === 'light',
                  "bg-cyan-900/20 border-cyan-400": theme === 'dark-plus'
                })}>
                  <p className={cn("text-sm", {
                    "text-cyan-900": theme === 'light',
                    "text-cyan-300": theme === 'dark-plus'
                  })}>
                    <strong>Benefit:</strong> Instant, bi-directional sync. As soon as NavaFlow detects a threat, the partner knows immediately.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Method 2: Ironclad Scraper */}
          <TabsContent value="scraper" className="space-y-6">
            <Card className={cn({
              "bg-white border-slate-200": theme === 'light',
              "bg-[#1e1e24] border-slate-700": theme === 'dark-plus'
            })}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Database className={cn("w-6 h-6", {
                    "text-indigo-600": theme === 'light',
                    "text-indigo-400": theme === 'dark-plus'
                  })} />
                  <div>
                    <CardTitle className={cn({
                      "text-slate-900": theme === 'light',
                      "text-slate-100": theme === 'dark-plus'
                    })}>
                      Method 2: The "Ironclad Scraper" Service (Deep Insights)
                    </CardTitle>
                    <CardDescription className={cn("mt-1", {
                      "text-slate-600": theme === 'light',
                      "text-slate-400": theme === 'dark-plus'
                    })}>
                      Ultimate Competitor Intelligence Service
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className={cn("p-4 rounded-lg", {
                  "bg-slate-50": theme === 'light',
                  "bg-slate-900/50": theme === 'dark-plus'
                })}>
                  <h3 className={cn("font-semibold mb-3", {
                    "text-slate-900": theme === 'light',
                    "text-slate-100": theme === 'dark-plus'
                  })}>
                    How they connect:
                  </h3>
                  <ol className={cn("list-decimal list-inside space-y-2", {
                    "text-slate-700": theme === 'light',
                    "text-slate-300": theme === 'dark-plus'
                  })}>
                    <li><strong>Subscription:</strong> They pay a monthly fee for access to the "Ironclad Scraper" Rust service.</li>
                    <li><strong>Targeting:</strong> They specify which sources to crawl (AWS Blogs, Competitor Pricelists, Vulnerability Databases).</li>
                  </ol>
                </div>

                <div>
                  <h4 className={cn("font-semibold mb-3", {
                    "text-slate-900": theme === 'light',
                    "text-slate-100": theme === 'dark-plus'
                  })}>
                    What they receive (The "Benefit"):
                  </h4>
                  <ul className={cn("space-y-2", {
                    "text-slate-700": theme === 'light',
                    "text-slate-300": theme === 'dark-plus'
                  })}>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className={cn("w-5 h-5 flex-shrink-0 mt-0.5", {
                        "text-green-600": theme === 'light',
                        "text-green-400": theme === 'dark-plus'
                      })} />
                      <span><strong>Zero-Notice Intelligence:</strong> If a competitor (e.g., AWS) updates their S3 pricing policy, NavaFlow detects it <strong>seconds</strong> after it goes live.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className={cn("w-5 h-5 flex-shrink-0 mt-0.5", {
                        "text-green-600": theme === 'light',
                        "text-green-400": theme === 'dark-plus'
                      })} />
                      <span><strong>Market Movement Alerts:</strong> If a competitor releases a "Zero-Day" vulnerability, NavaFlow scrapes the CVE database and alerts the security team instantly.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className={cn("w-5 h-5 flex-shrink-0 mt-0.5", {
                        "text-green-600": theme === 'light',
                        "text-green-400": theme === 'dark-plus'
                      })} />
                      <span><strong>Visual Trend Analysis:</strong> NavaFlow processes raw HTML/CSS and extracts "Deep Insights" (e.g., "They changed their button color to red").</span>
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Method 3: RDKD */}
          <TabsContent value="rdkd" className="space-y-6">
            <Card className={cn({
              "bg-white border-slate-200": theme === 'light',
              "bg-[#1e1e24] border-slate-700": theme === 'dark-plus'
            })}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Brain className={cn("w-6 h-6", {
                    "text-purple-600": theme === 'light',
                    "text-purple-400": theme === 'dark-plus'
                  })} />
                  <div>
                    <CardTitle className={cn({
                      "text-slate-900": theme === 'light',
                      "text-slate-100": theme === 'dark-plus'
                    })}>
                      Method 3: The RDKD (Instant Learning) Service
                    </CardTitle>
                    <CardDescription className={cn("mt-1", {
                      "text-slate-600": theme === 'light',
                      "text-slate-400": theme === 'dark-plus'
                    })}>
                      0.15ms Knowledge Graph Updates
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className={cn("p-4 rounded-lg", {
                  "bg-slate-50": theme === 'light',
                  "bg-slate-900/50": theme === 'dark-plus'
                })}>
                  <h3 className={cn("font-semibold mb-3", {
                    "text-slate-900": theme === 'light',
                    "text-slate-100": theme === 'dark-plus'
                  })}>
                    How they connect:
                  </h3>
                  <ol className={cn("list-decimal list-inside space-y-2", {
                    "text-slate-700": theme === 'light',
                    "text-slate-300": theme === 'dark-plus'
                  })}>
                    <li><strong>Vector Input:</strong> They send a text string (e.g., "New regulation X-2024") or a JSON payload to our <code className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-900">/api/v1/rdkd/nudge</code> endpoint.</li>
                    <li><strong>The Result:</strong> Within 0.15ms, their internal concept vector (in their LLM) is updated to encompass the new regulation.</li>
                  </ol>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className={cn("font-semibold", {
                      "text-slate-900": theme === 'light',
                      "text-slate-100": theme === 'dark-plus'
                    })}>
                      Code Example:
                    </h4>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(rdkdCode, 'rdkd-code')}
                      className="h-8"
                    >
                      {copiedCode === 'rdkd-code' ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                  <pre className={cn("p-4 rounded-lg overflow-x-auto text-sm", {
                    "bg-slate-900 text-slate-100": theme === 'light',
                    "bg-black text-slate-300": theme === 'dark-plus'
                  })}>
                    <code>{rdkdCode}</code>
                  </pre>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Method 4: NavaChain */}
          <TabsContent value="blockchain" className="space-y-6">
            <Card className={cn({
              "bg-white border-slate-200": theme === 'light',
              "bg-[#1e1e24] border-slate-700": theme === 'dark-plus'
            })}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Shield className={cn("w-6 h-6", {
                    "text-green-600": theme === 'light',
                    "text-green-400": theme === 'dark-plus'
                  })} />
                  <div>
                    <CardTitle className={cn({
                      "text-slate-900": theme === 'light',
                      "text-slate-100": theme === 'dark-plus'
                    })}>
                      Method 4: NavaChain (Blockchain Audit)
                    </CardTitle>
                    <CardDescription className={cn("mt-1", {
                      "text-slate-600": theme === 'light',
                      "text-slate-400": theme === 'dark-plus'
                    })}>
                      Ironclad Security Layer
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className={cn("p-4 rounded-lg", {
                  "bg-slate-50": theme === 'light',
                  "bg-slate-900/50": theme === 'dark-plus'
                })}>
                  <h3 className={cn("font-semibold mb-3", {
                    "text-slate-900": theme === 'light',
                    "text-slate-100": theme === 'dark-plus'
                  })}>
                    How they connect:
                  </h3>
                  <ol className={cn("list-decimal list-inside space-y-2", {
                    "text-slate-700": theme === 'light',
                    "text-slate-300": theme === 'dark-plus'
                  })}>
                    <li><strong>Verification:</strong> They use the <code className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-900">BlockchainVerify</code> component or API (<code className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-900">/api/v1/audit/verify</code>) to check the hash of a log entry against the Polygon L2 ledger.</li>
                    <li><strong>Proof:</strong> They can view the "On-Chain Hash" and "IPFS CID" in the dashboard to prove to auditors that the log has not been altered.</li>
                  </ol>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Method 5: Holographic */}
          <TabsContent value="holographic" className="space-y-6">
            <Card className={cn({
              "bg-white border-slate-200": theme === 'light',
              "bg-[#1e1e24] border-slate-700": theme === 'dark-plus'
            })}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Zap className={cn("w-6 h-6", {
                    "text-yellow-600": theme === 'light',
                    "text-yellow-400": theme === 'dark-plus'
                  })} />
                  <div>
                    <CardTitle className={cn({
                      "text-slate-900": theme === 'light',
                      "text-slate-100": theme === 'dark-plus'
                    })}>
                      Method 5: Holographic Ops & Command Center
                    </CardTitle>
                    <CardDescription className={cn("mt-1", {
                      "text-slate-600": theme === 'light',
                      "text-slate-400": theme === 'dark-plus'
                    })}>
                      Real-time Visual Layer
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className={cn("p-4 rounded-lg", {
                  "bg-slate-50": theme === 'light',
                  "bg-slate-900/50": theme === 'dark-plus'
                })}>
                  <h3 className={cn("font-semibold mb-3", {
                    "text-slate-900": theme === 'light',
                    "text-slate-100": theme === 'dark-plus'
                  })}>
                    How they connect:
                  </h3>
                  <ol className={cn("list-decimal list-inside space-y-2", {
                    "text-slate-700": theme === 'light',
                    "text-slate-300": theme === 'dark-plus'
                  })}>
                    <li><strong>Stream Subscription:</strong> They connect to <code className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-900">wss://ws.navaflow.com/ops</code> to receive live updates.</li>
                    <li><strong>Event Types:</strong> <code className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-900">incident_start</code>, <code className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-900">cmdp_decision</code></li>
                  </ol>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Method 6: Zero-Trust */}
          <TabsContent value="zero-trust" className="space-y-6">
            <Card className={cn({
              "bg-white border-slate-200": theme === 'light',
              "bg-[#1e1e24] border-slate-700": theme === 'dark-plus'
            })}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Shield className={cn("w-6 h-6", {
                    "text-red-600": theme === 'light',
                    "text-red-400": theme === 'dark-plus'
                  })} />
                  <div>
                    <CardTitle className={cn({
                      "text-slate-900": theme === 'light',
                      "text-slate-100": theme === 'dark-plus'
                    })}>
                      Method 6: The "Zero-Trust" Interceptor
                    </CardTitle>
                    <CardDescription className={cn("mt-1", {
                      "text-slate-600": theme === 'light',
                      "text-slate-400": theme === 'dark-plus'
                    })}>
                      Cyber Defense & Threat Protection
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className={cn("p-4 rounded-lg", {
                  "bg-slate-50": theme === 'light',
                  "bg-slate-900/50": theme === 'dark-plus'
                })}>
                  <h3 className={cn("font-semibold mb-3", {
                    "text-slate-900": theme === 'light',
                    "text-slate-100": theme === 'dark-plus'
                  })}>
                    How they connect:
                  </h3>
                  <ol className={cn("list-decimal list-inside space-y-2", {
                    "text-slate-700": theme === 'light',
                    "text-slate-300": theme === 'dark-plus'
                  })}>
                    <li><strong>Signature Upload:</strong> They send sample payloads to NavaFlow's <code className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-900">/api/v1/zero-trust/ingest</code> endpoint.</li>
                    <li><strong>Monitoring:</strong> They query the <code className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-900">check_packet</code> status to see if NavaFlow is actively killing threats.</li>
                  </ol>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Benefits Table */}
        <Card className={cn({
          "bg-white border-slate-200": theme === 'light',
          "bg-[#1e1e24] border-slate-700": theme === 'dark-plus'
        })}>
          <CardHeader>
            <CardTitle className={cn({
              "text-slate-900": theme === 'light',
              "text-slate-100": theme === 'dark-plus'
            })}>
              💼 The Value Proposition: Summary of Benefits
            </CardTitle>
            <CardDescription className={cn({
              "text-slate-600": theme === 'light',
              "text-slate-400": theme === 'dark-plus'
            })}>
              For Any Company (Partner, Customer, or Internal Team)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className={cn("w-full border-collapse", {
                "text-slate-900": theme === 'light',
                "text-slate-100": theme === 'dark-plus'
              })}>
                <thead>
                  <tr className={cn("border-b", {
                    "border-slate-200": theme === 'light',
                    "border-slate-700": theme === 'dark-plus'
                  })}>
                    <th className={cn("text-left p-4 font-semibold", {
                      "text-slate-900": theme === 'light',
                      "text-slate-100": theme === 'dark-plus'
                    })}>Feature</th>
                    <th className={cn("text-left p-4 font-semibold", {
                      "text-slate-900": theme === 'light',
                      "text-slate-100": theme === 'dark-plus'
                    })}>Benefit</th>
                    <th className={cn("text-left p-4 font-semibold", {
                      "text-slate-900": theme === 'light',
                      "text-slate-100": theme === 'dark-plus'
                    })}>Impact</th>
                  </tr>
                </thead>
                <tbody>
                  {benefits.map((benefit, index) => (
                    <tr key={index} className={cn("border-b", {
                      "border-slate-100": theme === 'light',
                      "border-slate-800": theme === 'dark-plus'
                    })}>
                      <td className={cn("p-4 font-medium", {
                        "text-slate-900": theme === 'light',
                        "text-slate-100": theme === 'dark-plus'
                      })}>{benefit.feature}</td>
                      <td className={cn("p-4", {
                        "text-slate-700": theme === 'light',
                        "text-slate-300": theme === 'dark-plus'
                      })}>{benefit.benefit}</td>
                      <td className={cn("p-4", {
                        "text-slate-600": theme === 'light',
                        "text-slate-400": theme === 'dark-plus'
                      })}>{benefit.impact}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Call to Action */}
        <Card className={cn("border-2", {
          "bg-gradient-to-br from-cyan-50 to-indigo-50 border-cyan-500": theme === 'light',
          "bg-gradient-to-br from-cyan-900/20 to-indigo-900/20 border-cyan-400": theme === 'dark-plus'
        })}>
          <CardHeader>
            <CardTitle className={cn("flex items-center gap-2", {
              "text-slate-900": theme === 'light',
              "text-slate-100": theme === 'dark-plus'
            })}>
              <ArrowRight className="w-6 h-6" />
              🚀 How to Start (Call to Action)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className={cn("font-semibold mb-2", {
                "text-slate-900": theme === 'light',
                "text-slate-100": theme === 'dark-plus'
              })}>
                For Customers/Partners:
              </h4>
              <p className={cn({
                "text-slate-700": theme === 'light',
                "text-slate-300": theme === 'dark-plus'
              })}>
                Simply deploy the <strong>NavaFlow Agent</strong> (Rust binary or Docker container) on your network or cloud infrastructure. 
                Configure your systems to send logs to our endpoints.
              </p>
            </div>
            <div>
              <h4 className={cn("font-semibold mb-2", {
                "text-slate-900": theme === 'light',
                "text-slate-100": theme === 'dark-plus'
              })}>
                For Internal Teams:
              </h4>
              <p className={cn({
                "text-slate-700": theme === 'light',
                "text-slate-300": theme === 'dark-plus'
              })}>
                Go to your NavaFlow Dashboard and generate an <strong>API Key</strong> in the "Settings" (Integration Hub). 
                Copy that key into your deployment pipeline or <code className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-900">.env</code> file. 
                Your internal CI/CD pipeline is now "Ironclad" (Verified by NavaChain).
              </p>
            </div>
            <div className={cn("p-4 rounded-lg mt-4", {
              "bg-white/50": theme === 'light',
              "bg-black/30": theme === 'dark-plus'
            })}>
              <p className={cn("text-lg font-semibold", {
                "text-slate-900": theme === 'light',
                "text-slate-100": theme === 'dark-plus'
              })}>
                The Result:
              </p>
              <p className={cn("mt-2", {
                "text-slate-700": theme === 'light',
                "text-slate-300": theme === 'dark-plus'
              })}>
                You don't just get an app; you get an <strong>Autonomous Site Reliability Engineer</strong> that thinks, sees, 
                and protects your infrastructure at the speed of light. 🚀
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

const apiIntegrationCode = `// Partner registers a webhook to receive "BlackByte" alerts
const initNavaFlow = async () => {
  const response = await fetch('https://api.navaflow.com/v1/partners/webhooks', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer PARTNER_API_KEY',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      event: 'threat_detected',
      url: 'https://partner-app.com/hook'
    })
  });

  console.log('Partner Connected to NavaFlow Ironclad Loop');
};`;

const rdkdCode = `// Instant learning - update knowledge graph in 0.15ms
const nudgeRDKD = async (regulation: string) => {
  const response = await fetch('https://api.navaflow.com/v1/rdkd/nudge', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer API_KEY',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text: regulation,
      context: 'compliance'
    })
  });

  const result = await response.json();
  console.log('Knowledge graph updated:', result.vectorId);
};`;
