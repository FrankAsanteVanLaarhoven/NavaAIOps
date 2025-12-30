# 🧪 Testing the AI SRE Agent

## ✅ Test Incident Created

A test incident has been created for testing the AI SRE Agent.

---

## 🚀 Step-by-Step Testing Guide

### Step 1: Navigate to the Incident Thread

1. Open the application: **http://localhost:3000**
2. Navigate to the **"Incidents"** channel
3. Find the thread: **"Test: Database Latency Spike (P99)"**
4. Click to open the thread

### Step 2: Start the AI SRE Agent

1. Scroll down to the **"AI SRE Agent"** section
2. Click the **"Start Agent"** button
3. Watch the job tail stream begin

### Step 3: Watch the Detection Phase

You should see:
```
🔍 DETECTION [IN_PROGRESS]
   Scanning for anomalies...

⚠️ DETECTION [SUCCESS]
   Detected 1 anomaly/anomalies
   Highest Severity: 8.5/10 (CRITICAL)
   - Database query latency spike (P99) detected: 2450ms (threshold: 100ms)
```

### Step 4: Watch the Proposal Phase

You should see:
```
🤔 PROPOSAL_FIX [IN_PROGRESS]
   Analyzing anomalies and proposing remediation...

⏸️ EXECUTION_GATE [PENDING_HUMAN_APPROVAL]
   ⚠️ Action Required: I have detected 1 issue(s).
   
   Severity: CRITICAL (8.50/10).
   
   Proposed Remediation: Execute `Rollback Deployment v2.4.1`?
   
   Risk: HIGH
   Estimated Duration: 2m
   
   Reasoning: Selected Rollback Deployment v2.4.1 based on anomaly type: PERFORMANCE, severity: 8.5/10
   
   ⏸️ Waiting for human approval...
```

### Step 5: Approve the Remediation

1. Review the proposed remediation
2. Click **"Approve"** to proceed
3. The agent will continue automatically

### Step 6: Watch the Execution Phase

You should see:
```
🛠️ EXECUTION [IN_PROGRESS]
   Executing remediation: Rollback Deployment v2.4.1
   Running command...

🛠️ EXECUTION [SUCCESS]
   Execution Log:
   [INFO] Executed Rollback Deployment v2.4.1
   [INFO] Type: KUBECTL
   [INFO] Command: kubectl rollout undo deployment/app-service --namespace=production
   [INFO] Risk Level: HIGH
   [INFO] Started at: [timestamp]
   [SUCCESS] Remediation completed successfully
   [INFO] Completed at: [timestamp]
   Status: SUCCESS ✅
```

### Step 7: Watch the Verification Phase

You should see:
```
🔍 VERIFICATION [IN_PROGRESS]
   Verifying remediation by re-checking metrics...

🔍 VERIFICATION [SUCCESS]
   Verification Result:
   Remediation verified: Metrics have returned to normal levels. System is stable.
   Improvement: +96.1%
```

### Step 8: Watch the Closure

You should see:
```
✅ CLOSED [SUCCESS]
   Job Tail Completed:
   Incident resolved successfully.
   
   Summary:
   - Detected 1 anomaly/anomalies
   - Executed: Rollback Deployment v2.4.1
   - Verification: Metrics improved by 96.1%
   - System is now stable
   
   Incident [thread-id] closed.
```

---

## 🎯 Testing Scenarios

### Scenario 1: Approve Remediation ✅

1. Start the agent
2. Wait for the **EXECUTION_GATE**
3. Click **"Approve"**
4. Watch the agent execute and verify
5. Incident should close automatically

### Scenario 2: Reject Remediation ❌

1. Start the agent
2. Wait for the **EXECUTION_GATE**
3. Click **"Reject"**
4. Agent should stop with status: **REJECTED**
5. Incident remains open for manual intervention

### Scenario 3: Multiple Anomalies

The agent can detect multiple anomalies:
- High error rate
- Active critical incidents
- Performance degradation
- Availability issues

---

## 🔍 What to Observe

### Job Tail Features

1. **Real-time Streaming**: Events appear as they happen
2. **Phase Indicators**: Icons show current phase (🔍 🤔 ⏸️ 🛠️ ✅)
3. **Status Badges**: Color-coded status (PENDING, SUCCESS, FAILED)
4. **Timestamps**: Each event has a timestamp
5. **Approval UI**: Yellow banner appears at approval gates

### Agent Behavior

1. **Automatic Detection**: No human intervention needed
2. **Smart Proposal**: AI selects best remediation script
3. **Human Gates**: Critical actions require approval
4. **Automatic Verification**: Metrics re-checked automatically
5. **Self-Healing**: Incident closes when resolved

---

## 🐛 Troubleshooting

### Agent Doesn't Start

- Check browser console for errors
- Verify API endpoint is accessible: `/api/ai/sre/remediate`
- Check network tab for failed requests

### Stream Stops Unexpectedly

- Check browser console for errors
- Verify server logs for errors
- Try refreshing and starting again

### Approval Doesn't Work

- Check API endpoint: `/api/ai/sre/approve`
- Verify `updateId` is present in metadata
- Check browser console for errors

### No Anomalies Detected

- The agent will show "System healthy. No anomalies detected."
- Create more incidents or errors to trigger detection
- Check audit logs for recent activity

---

## 📊 Expected Results

### Successful Flow

1. ✅ Detection finds anomalies
2. ✅ Proposal selects remediation script
3. ✅ Human approves execution
4. ✅ Execution completes successfully
5. ✅ Verification confirms fix
6. ✅ Incident closes automatically

### Rejected Flow

1. ✅ Detection finds anomalies
2. ✅ Proposal selects remediation script
3. ❌ Human rejects execution
4. ⏸️ Agent stops with REJECTED status
5. 📋 Incident remains open for manual intervention

---

## 🎉 Success Criteria

The AI SRE Agent is working correctly if:

- ✅ Detects anomalies automatically
- ✅ Proposes appropriate remediation
- ✅ Waits for human approval
- ✅ Executes remediation when approved
- ✅ Verifies fixes automatically
- ✅ Closes incidents when resolved
- ✅ Handles rejections gracefully
- ✅ Streams job tail in real-time

---

## 📝 Test Incident Details

**Thread ID**: Check console output from seed script  
**Channel**: Incidents  
**Severity**: SEV-1  
**Status**: Investigating  
**Impact**: Database query latency spike  

---

**Ready to test!** 🚀

Navigate to the incident thread and start the AI SRE Agent to see it in action.
