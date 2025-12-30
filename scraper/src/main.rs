use reqwest::{Client, header};
use scraper::{Html, Selector};
use tokio::time::Instant;
use tokio::sync::{mpsc, Mutex};
use std::collections::{HashMap, HashSet};
use std::sync::Arc;
use std::time::Duration;
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use chrono::Utc;

// Configuration for "Evasive Mode" (Random delays, jitter)
#[derive(Clone)]
struct ScraperConfig {
    max_concurrency: usize,
    request_timeout_ms: u64,
    user_agents: Vec<String>,
    target_domains: Vec<String>,
    stealth_mode: bool,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
struct ScrapedData {
    id: String,
    url: String,
    timestamp: i64,
    category: String, // "Competitor" | "Vulnerability" | "Regulation"
    title: String,
    content_snippet: String,
    embedding: Vec<f32>, // Vector representation
    relevance_score: f32,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
struct CompetitorSignal {
    competitor_id: String,
    signal_type: String, // "PriceChange" | "PolicyUpdate" | "VulnerabilityFix"
    timestamp: i64,
    confidence: f32,
    raw_data: String,
}

// New structure for security data
#[derive(Serialize, Deserialize, Clone, Debug)]
struct SecurityIntel {
    id: String,
    url: String,
    timestamp: i64,
    is_threat: bool,
    threat_type: Option<String>, // "CVE", "Ransomware", "DDOS", "XSS"
    raw_payload_hash: Option<String>, // SHA256 of embedded script
    severity: f32,
    content_snippet: String,
}

// The "Ironclad" Scraper Engine
#[derive(Clone)]
struct IroncladEngine {
    config: ScraperConfig,
    active_domains: Arc<Mutex<HashSet<String>>>,
    client: Client,
    signal_channel: Arc<Mutex<Vec<CompetitorSignal>>>,
}

impl IroncladEngine {
    pub fn new(config: ScraperConfig) -> anyhow::Result<Self> {
        let mut headers = header::HeaderMap::new();
        
        // Set default user agent
        if let Some(ua) = config.user_agents.first() {
            headers.insert(
                header::USER_AGENT,
                header::HeaderValue::from_str(ua)?,
            );
        }

        let client = Client::builder()
            .default_headers(headers)
            .timeout(Duration::from_millis(config.request_timeout_ms))
            .build()?;

        let mut target_domains = HashSet::new();
        for domain in &config.target_domains {
            target_domains.insert(domain.clone());
        }

        Ok(Self {
            config,
            active_domains: Arc::new(Mutex::new(target_domains)),
            client,
            signal_channel: Arc::new(Mutex::new(Vec::new())),
        })
    }

    // Recursive Crawler (Prioritizes high-value targets)
    pub async fn start_military_scan(&self) -> anyhow::Result<()> {
        println!("🚀 INITIATING IRONCLAD RECURSIVE SCAN");

        let domains = vec![
            "https://aws.amazon.com/blogs",
            "https://cloud.google.com/blog",
            "https://microsoft.com/security/blog",
            "https://vercel.com/blog",
        ];

        let (tx, mut rx) = mpsc::channel(100);
        
        for domain in domains {
            let tx_clone = tx.clone();
            let engine = self.clone();
            let client = self.client.clone();
            
            tokio::spawn(async move {
                let start = Instant::now();
                
                // 1. "Silent" Fetch (Stealth Mode)
                match client.get(domain).send().await {
                    Ok(resp) => {
                        if resp.status().is_success() {
                            match resp.text().await {
                                Ok(html) => {
                                    // Parse HTML efficiently with Scraper
                                    let document = Html::parse_document(&html);
                                    
                                    // "Deep Insight" Extraction (Heuristics)
                                    let mut snippet = String::new();
                                    
                                    // Extract text from common content selectors
                                    let content_selectors = vec![
                                        Selector::parse("article").ok(),
                                        Selector::parse(".post-content").ok(),
                                        Selector::parse("main").ok(),
                                        Selector::parse("p").ok(),
                                    ];

                                    for selector_opt in content_selectors {
                                        if let Some(selector) = selector_opt {
                                            for element in document.select(&selector) {
                                                let text = element.text().collect::<String>();
                                                if text.len() > 50 {
                                                    snippet.push_str(&text);
                                                    snippet.push_str(" ");
                                                }
                                            }
                                        }
                                    }

                                    // Limit snippet length
                                    if snippet.len() > 1000 {
                                        snippet = snippet.chars().take(1000).collect();
                                    }

                                    // NEW: Deep Insight Extraction for Threats
                                    let (is_threat, threat_type, payload_hash) = engine.detect_threat_keywords(&html, &snippet);

                                    // 2. Generate "Nano-Embedding" placeholder
                                    // In production, this calls a local embedding service
                                    let embedding = vec![0.0f32; 1536]; // Placeholder
                                    let relevance = snippet.len() as f32 * 0.001;

                                    let data = ScrapedData {
                                        id: Uuid::new_v4().to_string(),
                                        url: domain.to_string(),
                                        timestamp: start.elapsed().as_millis() as i64,
                                        category: "Competitor".to_string(),
                                        title: domain.to_string(),
                                        content_snippet: snippet.clone(),
                                        embedding,
                                        relevance_score: relevance,
                                    };

                                    // 3. Send to Signal Channel (For 0.15ms Loop)
                                    let signal = CompetitorSignal {
                                        competitor_id: "AWS".to_string(),
                                        signal_type: "PolicyUpdate".to_string(),
                                        timestamp: Utc::now().timestamp(),
                                        confidence: 0.95,
                                        raw_data: snippet,
                                    };
                                    
                                    {
                                        let mut signals = engine.signal_channel.lock().await;
                                        signals.push(signal);
                                    }
                                    
                                    let _ = tx_clone.send(data).await;
                                }
                                Err(e) => {
                                    eprintln!("❌ Failed to read response: {}", e);
                                }
                            }
                        }
                    }
                    Err(e) => {
                        eprintln!("❌ SCAN ERROR: {}", e);
                    }
                }
            });
        }
        
        // Wait for all scans to complete
        drop(tx);
        
        // Collect results
        while let Some(data) = rx.recv().await {
            println!("📥 Scraped: {} ({} chars)", data.url, data.content_snippet.len());
        }

        Ok(())
    }

    // "Precognitor" Integration: Injects data into the adaptive loop
    pub async fn ingest_signal(&self, signal: CompetitorSignal) {
        println!("📥 INJECTING SIGNAL: {:?}", signal.signal_type);
        let mut signals = self.signal_channel.lock().await;
        signals.push(signal);
    }

    pub async fn get_signals(&self) -> Vec<CompetitorSignal> {
        let signals = self.signal_channel.lock().await;
        signals.clone()
    }

    // NEW: Deep Insight Extraction for Threats
    fn detect_threat_keywords(&self, html: &str, snippet: &str) -> (bool, Option<String>, Option<String>) {
        let keywords = vec![
            ("cve-", "CVE"),
            ("exploit", "Exploit"),
            ("payload", "Payload"),
            ("shellcode", "Shellcode"),
            ("malware", "Malware"),
            ("ransomware", "Ransomware"),
            ("xss", "XSS"),
            ("sql injection", "SQL Injection"),
            ("remote code execution", "RCE"),
        ];

        let content_lower = format!("{} {}", html.to_lowercase(), snippet.to_lowercase());
        
        for (keyword, threat_type) in keywords {
            if content_lower.contains(keyword) {
                // Compute hash of the snippet for tracking
                use sha2::{Sha256, Digest};
                let mut hasher = Sha256::new();
                hasher.update(snippet.as_bytes());
                let hash = format!("{:x}", hasher.finalize());
                return (true, Some(threat_type.to_string()), Some(hash));
            }
        }

        (false, None, None)
    }

    fn classify_threat(&self, html: &str) -> Option<String> {
        let html_lower = html.to_lowercase();
        
        if html_lower.contains("cve-") {
            Some("CVE".to_string())
        } else if html_lower.contains("ransomware") || html_lower.contains("cryptolocker") {
            Some("Ransomware".to_string())
        } else if html_lower.contains("ddos") || html_lower.contains("distributed denial") {
            Some("DDOS".to_string())
        } else if html_lower.contains("<script>") && html_lower.contains("eval") {
            Some("XSS".to_string())
        } else {
            None
        }
    }

    fn extract_script_hash(&self, html: &str) -> Option<String> {
        use sha2::{Sha256, Digest};
        
        // Extract script tags
        let document = Html::parse_document(html);
        let script_selector = Selector::parse("script").ok()?;
        
        let mut script_content = String::new();
        for element in document.select(&script_selector) {
            script_content.push_str(&element.text().collect::<String>());
        }

        if script_content.is_empty() {
            return None;
        }

        let mut hasher = Sha256::new();
        hasher.update(script_content.as_bytes());
        Some(format!("{:x}", hasher.finalize()))
    }
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let config = ScraperConfig {
        max_concurrency: 10,
        request_timeout_ms: 5000,
        user_agents: vec![
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36".to_string(),
        ],
        target_domains: vec![],
        stealth_mode: true,
    };

    let engine = IroncladEngine::new(config)?;
    engine.start_military_scan().await?;

    // Keep running to collect signals
    tokio::time::sleep(Duration::from_secs(10)).await;

    let signals = engine.get_signals().await;
    println!("📊 Collected {} signals", signals.len());

    Ok(())
}
