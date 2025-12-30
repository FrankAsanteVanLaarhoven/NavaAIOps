# 🛡️ CMDP Architecture - Verifiable, Validated, Certified AI Ops

## ✅ Implementation Complete

NavaFlow now implements a **Constrained Markov Decision Process (CMDP)** architecture that enforces a strict **Plan -> Retrieve -> Reason -> Constrain -> Execute** loop with verification, validation, and certification.

---

## 🏗️ CMDP Architecture Overview

### The CMDP Loop

```
1. PLAN (Chain of Thought)
   ↓
   LLM creates structured plan with steps and reflexors
   ↓
2. RETRIEVE (Evidence Gathering)
   ↓
   Reflexors fetch hard data (logs, metrics, screenshots)
   ↓
3. REASON (Evidence Analysis)
   ↓
   LLM analyzes evidence against plan
   ↓
4. CONSTRAIN (Self-Correction)
   ↓
   Validation Engine (Rules) + Verification Agent (LLM)
   ↓
5. EXECUTE (Action Jitters)
   ↓
   Only if validated and verified
   ↓
6. CERTIFY (PDF Certificate)
   ↓
   Tamper-proof execution report
```

---

## 🔄 Core Components

### 1. CMDP Loop (`src/lib/ai/cmdp-loop.ts`)

**Functions**:
- `planChain()` - Generates structured plan with steps and reflexors
- `retrieveEvidence()` - Fetches evidence using reflexors
- `reasonAgainstEvidence()` - Analyzes evidence against plan
- `executeCMDPChain()` - Main execution loop

**Key Features**:
- Explicit step-by-step planning
- Evidence-based reasoning (no hallucinations)
- Self-correction when evidence doesn't support plan
- Structured execution log

### 2. Validation Engine (`src/lib/ai/validation-engine.ts`)

**Rule-Based Governance**:
- Production safety (no deletes, no DB drops)
- Cloud resource limits (max scale, max spend)
- Security policies (no secrets in logs)
- Fast, deterministic checks

**Functions**:
- `validateProposedAction()` - Checks action against policies
- Returns: `{ allowed: boolean, violations: string[] }`

### 3. Verification Agent (`src/lib/ai/verification-agent.ts`)

**LLM-Based Second Opinion**:
- Independent review of Controller's proposals
- Checks evidence support
- Validates DevOps best practices
- Detects over-reactions

**Functions**:
- `verifyExecution()` - LLM verification of action
- Returns: `{ approved: boolean, reason?: string, warning?: string }`

### 4. Certificate Generator (`src/lib/certs/certificate-generator.ts`)

**PDF Certificate Generation**:
- Tamper-proof execution reports
- SHA-256 hash for integrity
- Detailed step-by-step validation logs
- Downloadable PDF certificates

**Functions**:
- `generateCertificate()` - Creates PDF with execution log
- Returns: `{ pdfBuffer: Buffer, pdfHash: string }`

---

## 🚀 API Endpoints

### POST `/api/ai/sre/cmdp`

Execute CMDP loop:

```typescript
{
  "context": {
    "incident": {...},
    "metrics": [...],
    "query": "Resolve database latency spike"
  },
  "workspaceId": "workspace-123",
  "incidentId": "incident-456",
  "execute": true
}

// Returns:
{
  "plan": { steps: [...], reasoning: "..." },
  "executionLog": [...],
  "allApproved": true
}
```

### POST `/api/certs/generate`

Generate PDF certificate:

```typescript
{
  "executionLogs": [...],
  "planId": "plan-123",
  "workspaceId": "workspace-123"
}

// Returns: PDF file (application/pdf)
```

---

## 🎯 CMDP Features

### 1. Explicit Planning
- LLM must output structured JSON plan
- Each step identifies required reflexors
- No one-shot reasoning

### 2. Evidence-Based Reasoning
- Reflexors fetch actual data (logs, metrics, screenshots)
- LLM cannot hallucinate - must cite evidence
- Evidence stored in `evidenceStore` for verification

### 3. Constraint Checking
- **Rule-Based**: Fast, deterministic policy checks
- **LLM-Based**: Second opinion from verification agent
- Both must pass for execution

### 4. Self-Correction
- If evidence doesn't support plan → HALT
- LLM must re-plan or fail gracefully
- No blind execution

### 5. Certification
- Every execution generates tamper-proof PDF
- SHA-256 hash for integrity verification
- Complete audit trail

---

## 🛡️ Safety Layers

### Layer 1: Rule-Based Validation (Fast)
- Production safety checks
- Resource limits
- Security policies
- **Result**: Immediate rejection if unsafe

### Layer 2: LLM Verification (Thorough)
- Evidence support check
- Best practices validation
- Over-reaction detection
- **Result**: Second opinion before execution

### Layer 3: Execution Monitoring
- Real-time execution status
- Failure handling
- Rollback on errors
- **Result**: Safe execution with monitoring

### Layer 4: Certification
- PDF generation
- Hash verification
- Audit trail
- **Result**: Tamper-proof record

---

## 📊 Execution Flow

### Example: Database Latency Spike

1. **PLAN**:
   ```
   Step 1: Check metrics (reflexor: check-metrics)
   Step 2: Fetch logs (reflexor: fetch-logs)
   Step 3: Analyze evidence (reflexor: analyze-screenshot)
   Step 4: Execute rollback (reflexor: execute-action)
   ```

2. **RETRIEVE**:
   - Metrics: `{ latency: 2450ms, errorRate: 0.05 }`
   - Logs: `[{ action: 'DELETE', table: 'Message', ... }]`
   - Screenshot: `{ analyzed: true, embedding: [...] }`

3. **REASON**:
   - Evidence shows high latency and error rate
   - Logs show recent DELETE operations
   - Screenshot confirms infrastructure issues
   - **Proceed**: Yes, evidence supports rollback

4. **CONSTRAIN**:
   - **Rule Check**: Rollback allowed? ✅
   - **Verification Agent**: Evidence supports action? ✅
   - **Result**: Approved for execution

5. **EXECUTE**:
   - Execute rollback deployment
   - Monitor execution status
   - Log results

6. **CERTIFY**:
   - Generate PDF certificate
   - Include all validation steps
   - Hash for integrity

---

## 🎨 Frontend Integration

### VerifiedActionPanel Component

Shows execution verification status:

- **Rule Engine Status**: ✅ Allowed / ❌ Blocked
- **Verification Agent Status**: ✅ Approved / ❌ Rejected
- **Execution Status**: ✅ Success / ❌ Failed
- **Download Certificate**: PDF export

### Integration in SREPanel

The `SREPanel` automatically shows `VerifiedActionPanel` after execution completes, displaying:
- All validation steps
- Verification results
- Certificate download button

---

## 🔒 Governance Policies

### Production Environment
- `noDelete`: Cannot delete production tables
- `noDropDatabase`: Cannot drop databases
- `noHardReset`: No hard resets

### Cloud Resources
- `maxScale`: 10 (max replicas per action)
- `maxSpend`: $10,000 (max cost per action)
- `costLimit`: 50 (cost score threshold)

### Security
- `requireApprovalForCritical`: Critical actions need manual approval
- `noSecretInLogs`: No API keys in logs

---

## 📈 Benefits

### 1. Transparency
- Every step is logged and verified
- Evidence is cited, not hallucinated
- Complete audit trail

### 2. Safety
- Multiple validation layers
- Rule-based + LLM-based checks
- No blind execution

### 3. Accountability
- PDF certificates for every execution
- Tamper-proof hashes
- Compliance-ready

### 4. Self-Correction
- LLM must prove its work
- Evidence mismatch → HALT
- Continuous improvement

---

## 🚀 Usage

### Start CMDP Agent

1. Navigate to incident thread
2. Open "AI SRE Agent" panel
3. Click "Start Agent"
4. Watch CMDP loop execute:
   - Plan generation
   - Evidence retrieval
   - Reasoning
   - Validation & Verification
   - Execution
   - Certification

### View Verification

After execution, `VerifiedActionPanel` shows:
- Rule-based validation results
- LLM verification results
- Execution status
- Certificate download

---

## ✅ Status

**CMDP Architecture Fully Implemented!**

✅ Plan -> Retrieve -> Reason -> Constrain -> Execute loop  
✅ Validation Engine (Rule-based)  
✅ Verification Agent (LLM-based)  
✅ Certificate Generator (PDF)  
✅ Frontend Integration  
✅ SRE Agent Integration  
✅ Production Ready  

**The system is now verifiable, validated, and certified!** 🛡️

---

**Last Updated**: 2024  
**Status**: CMDP Architecture Complete ✅
