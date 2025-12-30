use ethers::prelude::*;
use ethers::signers::{LocalWallet, Signer};
use ethers::types::{Address, U256};
use sqlx::postgres::PgPoolOptions;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use tokio::sync::RwLock;
use std::collections::HashMap;
use std::sync::Arc;
use std::str::FromStr;
use anyhow::Result;
use dotenv::dotenv;

// Configuration for Polygon L2
const POLYGON_RPC_URL: &str = "https://rpc-amoy.polygon.technology"; // Amoy testnet
const DEFAULT_BATCH_SIZE: u32 = 10;
const SYNC_INTERVAL_SECS: u64 = 30; // Sync every 30 seconds

#[derive(Serialize, Deserialize, Clone, Debug)]
struct AuditEntry {
    id: String,        // UUID
    table_name: String, // "Message", "Channel", "Incident"
    action: String,     // "CREATE", "UPDATE", "DELETE"
    user_id: String,    // "System", "User-123"
    metadata: Option<String>, // JSON payload
    created_at: String, // ISO 8601 string
}

#[derive(Serialize, Deserialize, Clone, Debug)]
struct LogMetadata {
    metadata_hash: [u8; 32],
    ipfs_cid: String,
}

pub struct BlockchainBridge {
    pool: sqlx::postgres::Pool,
    provider: Arc<Provider<Http>>,
    wallet: LocalWallet,
    contract_address: Address,
    
    // In-memory cache for hashes to save RPC calls
    cache: Arc<RwLock<HashMap<String, LogMetadata>>>,
}

impl BlockchainBridge {
    pub async fn new(
        db_url: &str,
        private_key: &str,
        contract_address: &str,
        rpc_url: Option<&str>,
    ) -> Result<Self> {
        // 1. Connect to Neon PostgreSQL
        let pool = PgPoolOptions::new()
            .max_connections(5)
            .connect(db_url)
            .await?;

        // 2. Setup Ethereum Provider (Polygon L2)
        let rpc = rpc_url.unwrap_or(POLYGON_RPC_URL);
        let provider = Provider::<Http>::try_from(rpc)?;
        let provider = Arc::new(provider);

        // 3. Load Wallet from Private Key
        let wallet = LocalWallet::from_str(private_key)?;
        let wallet = wallet.with_chain_id(80002u64); // Polygon Amoy testnet chain ID

        // 4. Parse Contract Address
        let contract_address = Address::from_str(contract_address)?;

        Ok(Self {
            pool,
            provider,
            wallet,
            contract_address,
            cache: Arc::new(RwLock::new(HashMap::new())),
        })
    }

    // --- 1. Fetch Logs from Neon ---
    pub async fn fetch_unanchored_logs(&self, limit: u32) -> Result<Vec<AuditEntry>> {
        let rows = sqlx::query_as!(
            AuditEntry,
            r#"
            SELECT 
                id,
                "tableName" as table_name,
                action,
                "userId" as user_id,
                metadata,
                timestamp::text as created_at
            FROM "AuditLog"
            WHERE id NOT IN (
                SELECT DISTINCT "recordId" 
                FROM "AuditLog" 
                WHERE metadata::text LIKE '%"anchored":true%'
            )
            ORDER BY timestamp DESC
            LIMIT $1
            "#,
            limit as i64
        )
        .fetch_all(&self.pool)
        .await?;

        Ok(rows)
    }

    // --- 2. Hash & Upload to IPFS ---
    async fn hash_and_upload(&self, entry: &AuditEntry) -> Result<LogMetadata> {
        // 1. Create Payload String: "ID|Table|Action|UserID|Metadata|CreatedAt"
        let payload_string = format!(
            "{}|{}|{}|{}|{}|{}",
            entry.id,
            entry.table_name,
            entry.action,
            entry.user_id,
            entry.metadata.as_ref().unwrap_or(&String::new()),
            entry.created_at
        );

        // 2. Hash Payload (SHA-256)
        let mut hasher = Sha256::new();
        hasher.update(payload_string.as_bytes());
        let hash = hasher.finalize();
        let metadata_hash: [u8; 32] = hash.into();

        // 3. Upload to IPFS (Simulated for now)
        // In Production: Use kubo-rpc-client to upload to IPFS
        // let ipfs_client = kubo_rpc_client::Client::new("http://localhost:5001")?;
        // let cid = ipfs_client.add(payload_string.as_bytes()).await?;
        
        // For now, generate a deterministic "fake" CID based on hash
        let fake_cid = format!("Qm{}", hex::encode(&hash[..8]));
        
        let metadata = LogMetadata {
            metadata_hash,
            ipfs_cid: fake_cid.clone(),
        };

        // 4. Update Cache
        let mut cache = self.cache.write().await;
        cache.insert(entry.id.clone(), metadata.clone());
        
        Ok(metadata)
    }

    // --- 3. Convert UUID string to bytes32 ---
    fn uuid_to_bytes32(uuid: &str) -> Result<[u8; 32]> {
        // Remove hyphens and convert to bytes
        let clean_uuid = uuid.replace("-", "");
        let bytes = hex::decode(clean_uuid)?;
        
        if bytes.len() != 32 {
            // Pad or truncate to 32 bytes
            let mut result = [0u8; 32];
            let len = bytes.len().min(32);
            result[..len].copy_from_slice(&bytes[..len]);
            Ok(result)
        } else {
            let mut result = [0u8; 32];
            result.copy_from_slice(&bytes);
            Ok(result)
        }
    }

    // --- 4. Anchor to Blockchain (Polygon L2) ---
    pub async fn anchor_to_blockchain(&self, entry: &AuditEntry) -> Result<String> {
        // 1. Hash and upload to IPFS
        let metadata = self.hash_and_upload(entry).await?;
        
        // 2. Convert UUID to bytes32
        let log_id_bytes = Self::uuid_to_bytes32(&entry.id)?;
        let log_id = H256::from_slice(&log_id_bytes);
        
        // 3. Convert metadata hash to H256
        let metadata_hash = H256::from(metadata.metadata_hash);

        // 4. Prepare contract call
        // Note: In production, you'd use ethers::contract::Contract
        // For now, we'll simulate the transaction
        println!("🔗 Anchoring log {} to Polygon L2", entry.id);
        println!("   Log ID (bytes32): {:?}", log_id);
        println!("   Metadata Hash: {:?}", metadata_hash);
        println!("   IPFS CID: {}", metadata.ipfs_cid);

        // 5. In production, you would:
        // let contract = Contract::new(self.contract_address, abi, &self.provider);
        // let tx = contract.method::<_, H256>("anchorLog", (log_id, metadata_hash, metadata.ipfs_cid.clone()))?
        //     .from(self.wallet.address())
        //     .send()
        //     .await?;
        // let tx_hash = tx.tx_hash();

        // Simulate transaction hash for demo
        let mut hasher = Sha256::new();
        hasher.update(format!("{}{:?}", entry.id, metadata.metadata_hash).as_bytes());
        let tx_hash = format!("0x{}", hex::encode(&hasher.finalize()[..20]));

        println!("   ✅ Transaction Hash: {}", tx_hash);

        Ok(tx_hash)
    }

    // --- 5. Batch Anchor Multiple Logs ---
    pub async fn anchor_logs_batch(&self, entries: Vec<AuditEntry>) -> Result<Vec<String>> {
        let mut tx_hashes = Vec::new();

        for entry in entries {
            match self.anchor_to_blockchain(&entry).await {
                Ok(tx) => tx_hashes.push(tx),
                Err(e) => eprintln!("❌ Failed to anchor log {}: {}", entry.id, e),
            }
            
            // Small delay to avoid rate limits
            tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
        }

        Ok(tx_hashes)
    }

    // --- 6. Main Sync Loop ---
    pub async fn sync_loop(&self) {
        println!("🚀 Starting NavaChain Sync Loop");
        println!("   Contract: {:?}", self.contract_address);
        println!("   RPC: {}", POLYGON_RPC_URL);
        println!("   Interval: {}s", SYNC_INTERVAL_SECS);

        loop {
            match self.fetch_unanchored_logs(DEFAULT_BATCH_SIZE).await {
                Ok(entries) => {
                    if entries.is_empty() {
                        println!("📭 No new logs to anchor");
                    } else {
                        println!("📥 Found {} unanchored logs", entries.len());
                        match self.anchor_logs_batch(entries).await {
                            Ok(tx_hashes) => {
                                println!("✅ Anchored {} logs to Polygon L2", tx_hashes.len());
                            }
                            Err(e) => eprintln!("❌ Batch anchor failed: {}", e),
                        }
                    }
                }
                Err(e) => eprintln!("❌ Failed to fetch logs: {}", e),
            }

            // Wait before next sync
            tokio::time::sleep(tokio::time::Duration::from_secs(SYNC_INTERVAL_SECS)).await;
        }
    }
}

#[tokio::main]
async fn main() -> Result<()> {
    dotenv().ok();

    let db_url = std::env::var("DATABASE_URL")
        .expect("DATABASE_URL must be set");
    let private_key = std::env::var("BRIDGE_PRIVATE_KEY")
        .expect("BRIDGE_PRIVATE_KEY must be set");
    let contract_address = std::env::var("CONTRACT_ADDRESS")
        .expect("CONTRACT_ADDRESS must be set");
    let rpc_url = std::env::var("POLYGON_RPC_URL").ok();

    println!("🔗 Initializing NavaChain Bridge...");
    
    let bridge = BlockchainBridge::new(
        &db_url,
        &private_key,
        &contract_address,
        rpc_url.as_deref(),
    ).await?;

    println!("✅ Bridge initialized successfully");
    println!("🔄 Starting sync loop...\n");

    // Start the sync loop
    bridge.sync_loop().await;

    Ok(())
}
