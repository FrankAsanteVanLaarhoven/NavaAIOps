use std::collections::HashMap;
use sha2::{Sha256, Digest};
use serde::{Deserialize, Serialize};

/// Represents a specific malware signature (e.g., "BlackByte" ransomware variant)
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct ThreatVector {
    pub id: String,           // e.g., "THREAT_001"
    pub name: String,          // "BlackByte Ransomware"
    pub hash: String,          // SHA256 of the payload (header)
    pub severity: f32,        // 0.0 to 1.0 (Critical)
}

/// The "Virus Graph" - A fast hashmap of known threats
pub struct VirusGraph {
    graph: HashMap<String, ThreatVector>, // Map SHA256 Hash (hex string) -> ThreatVector
}

impl VirusGraph {
    pub fn new() -> Self {
        // In production, load from encrypted DB (Neon)
        let mut graph = HashMap::new();
        
        // Mock Entry: "BlackByte" Payload Hash (Mock)
        // Simulated by hashing "BlackByte" + timestamp
        let mock_hash = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"; 
        graph.insert(
            mock_hash.to_string(), 
            ThreatVector {
                id: "THREAT_001".to_string(),
                name: "BlackByte Ransomware Variant A".to_string(),
                hash: mock_hash.to_string(),
                severity: 1.0 // CRITICAL
            }
        );
        
        // Additional mock threats
        let mock_hash_2 = "a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3";
        graph.insert(
            mock_hash_2.to_string(),
            ThreatVector {
                id: "THREAT_002".to_string(),
                name: "XSS Payload Injection".to_string(),
                hash: mock_hash_2.to_string(),
                severity: 0.9
            }
        );
        
        Self { graph }
    }

    /// The "Zero-Trust" Check
    /// Returns (is_threat, threat_id, score)
    pub fn check_packet(&self, payload: &str) -> (bool, Option<String>, f32) {
        // 1. Compute Hash of Incoming Packet
        let mut hasher = Sha256::new();
        hasher.update(payload.as_bytes());
        let hash_bytes = hasher.finalize();
        let hash_hex = format!("{:x}", hash_bytes);
        
        // 2. Lookup in Virus Graph (O(1) operation)
        if let Some(threat) = self.graph.get(&hash_hex) {
            return (true, Some(threat.id.clone()), threat.severity);
        }
        
        return (false, None, 0.0);
    }

    /// Check if payload contains known threat patterns (heuristic)
    pub fn check_patterns(&self, payload: &str) -> (bool, Option<String>, f32) {
        let threat_patterns = vec![
            ("<script>eval(", "THREAT_SCRIPT_INJECT", 0.95),
            ("base64_decode", "THREAT_BASE64_OBFUSCATE", 0.85),
            ("exec(", "THREAT_CODE_EXEC", 0.90),
            ("rm -rf", "THREAT_FILE_DELETE", 0.95),
            ("cryptolocker", "THREAT_RANSOMWARE", 1.0),
        ];

        let payload_lower = payload.to_lowercase();
        for (pattern, threat_id, severity) in threat_patterns {
            if payload_lower.contains(pattern) {
                return (true, Some(threat_id.to_string()), severity);
            }
        }

        (false, None, 0.0)
    }

    /// Combined check: Hash + Pattern matching
    pub fn check(&self, payload: &str) -> (bool, Option<String>, f32, String) {
        // First check hash
        let (is_threat_hash, threat_id_hash, score_hash) = self.check_packet(payload);
        if is_threat_hash {
            return (true, threat_id_hash, score_hash, "hash_match".to_string());
        }

        // Then check patterns
        let (is_threat_pattern, threat_id_pattern, score_pattern) = self.check_patterns(payload);
        if is_threat_pattern {
            return (true, threat_id_pattern, score_pattern, "pattern_match".to_string());
        }

        (false, None, 0.0, "clean".to_string())
    }

    /// Add a new threat to the graph (for dynamic updates)
    pub fn add_threat(&mut self, threat: ThreatVector) {
        self.graph.insert(threat.hash.clone(), threat);
    }

    /// Get threat count
    pub fn threat_count(&self) -> usize {
        self.graph.len()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_virus_graph_creation() {
        let graph = VirusGraph::new();
        assert!(graph.threat_count() > 0);
    }

    #[test]
    fn test_threat_detection() {
        let graph = VirusGraph::new();
        // Test with a known pattern
        let malicious_payload = "<script>eval(atob('base64_encoded_payload'))</script>";
        let (is_threat, threat_id, score, method) = graph.check(malicious_payload);
        assert!(is_threat);
        assert!(score > 0.0);
        assert_eq!(method, "pattern_match");
    }

    #[test]
    fn test_clean_payload() {
        let graph = VirusGraph::new();
        let clean_payload = "Hello, this is a normal HTTP request.";
        let (is_threat, _, _, _) = graph.check(clean_payload);
        assert!(!is_threat);
    }
}
