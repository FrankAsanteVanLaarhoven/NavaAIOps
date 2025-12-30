# 🚀 NavaFlow - Canary Deployment & A/B Testing

## ✅ Custom Model Integrated

**Model ID**: `ft:gpt-4o-mini-navaflow-devops-v1`  
**Base**: GLM 4.7 (via gpt-4o-mini fine-tuning)  
**Training Data**: 50 incidents, 500 audit logs, 300 code contexts

---

## 🎯 Model Capabilities

### 1. Instant Incident Triage
- ✅ Reads raw incident JSON logs
- ✅ Classifies severity (SEV-0, SEV-1, SEV-2, SEV-3) instantly
- ✅ Suggests structured Root Cause Analysis (RCA)
- ✅ References patterns from Audit Logs

### 2. Security & Compliance Scanning
- ✅ Scans code snippets from Context Modules
- ✅ Detects hardcoded secrets (e.g., `sk-or-v1...`)
- ✅ Flags high-risk WorkflowTrigger configurations
- ✅ Verifies RBAC/ABAC policies

### 3. Predictive Workflow Suggestions
- ✅ Analyzes Audit Logs for failure patterns
- ✅ Suggests automation workflows
- ✅ Drafts incident response workflows

### 4. Context-Aware Communication
- ✅ Knows NavaFlow Incident Channel structure
- ✅ References specific team members
- ✅ Uses domain-specific terminology

---

## 🚀 Canary Deployment Strategy

### Phase 1: Canary Group (10% Traffic)

**Configuration**:
```bash
# .env
FINETUNED_MODEL_ID=ft:gpt-4o-mini-navaflow-devops-v1
FINETUNED_MODEL_WEIGHT=10  # 10% of traffic
CANARY_USER_IDS=user-1,user-2,user-3  # Always use fine-tuned
```

**How It Works**:
- Canary users (in `CANARY_USER_IDS`) always get fine-tuned model
- Other users: 10% get fine-tuned, 90% get base model
- Track metrics: response time, accuracy, user satisfaction

### Phase 2: A/B Testing (50/50 Split)

**Configuration**:
```bash
FINETUNED_MODEL_WEIGHT=50  # 50% of traffic
```

**Metrics to Track**:
- Resolution Time (how fast it triages)
- Accuracy (does RCA match reality?)
- User Ratings (blind SRE ratings)

### Phase 3: Full Rollout (100%)

**Configuration**:
```bash
FINETUNED_MODEL_WEIGHT=100  # 100% of traffic
```

**When to Rollout**:
- Fine-tuned model wins on accuracy
- Response time is acceptable
- User satisfaction is high

---

## 📊 A/B Testing Implementation

### Automatic Model Selection

The system automatically selects model variant based on:
1. **Canary Users**: Always use fine-tuned model
2. **Weighted Random**: Based on `FINETUNED_MODEL_WEIGHT`
3. **Feature Flags**: Per-feature A/B testing

### Usage Tracking

Every AI call tracks:
- Model variant used
- Response time
- Tokens used
- User ID
- Feature (incident/audit/code)

### Analytics Dashboard

View A/B test results at:
- `/dashboard/ab-test` - A/B test dashboard
- `/api/ab-test/results?feature=incident&days=7` - API endpoint

---

## 🔧 Configuration

### Environment Variables

```bash
# Fine-Tuned Model
FINETUNED_MODEL_ID=ft:gpt-4o-mini-navaflow-devops-v1

# A/B Testing
FINETUNED_MODEL_WEIGHT=10  # 10% canary
CANARY_USER_IDS=user-1,user-2,user-3

# Base Model (fallback)
AI_MODEL=zhip-ai/zlm-7b-v3.5-ny-free
```

### Canary Users

Add user IDs to `CANARY_USER_IDS`:
```bash
CANARY_USER_IDS=user-123,user-456,user-789
```

These users will always get the fine-tuned model.

---

## 📈 Metrics to Monitor

### 1. Resolution Time
- **Target**: < 2 seconds for incident resolution
- **Track**: Average response time per model variant

### 2. Accuracy
- **Target**: > 80% RCA accuracy
- **Track**: SRE blind ratings

### 3. User Satisfaction
- **Target**: > 4/5 stars
- **Track**: User feedback on resolutions

### 4. Cost
- **Track**: Tokens used per request
- **Compare**: Fine-tuned vs base model costs

---

## 🎯 Usage Examples

### Incident Resolution (with A/B Testing)

```typescript
import { resolveIncident } from '@/lib/ai-finetuned';

// Automatically uses A/B testing if userId provided
const resolution = await resolveIncident({
  incidentId: 'thread-id',
  userId: 'user-123', // Enables A/B testing
  useABTesting: true, // Default: true
});
```

### Audit Log Analysis (with A/B Testing)

```typescript
import { analyzeAuditLog } from '@/lib/ai-finetuned';

const analysis = await analyzeAuditLog({
  logEntry: {
    tableName: 'Message',
    action: 'DELETE',
    userId: 'user-123',
    timestamp: new Date(),
  },
  userId: 'user-123', // Enables A/B testing
});
```

### Force Fine-Tuned Model (Skip A/B Testing)

```typescript
// Always use fine-tuned model
const resolution = await resolveIncident({
  incidentId: 'thread-id',
  modelId: 'ft:gpt-4o-mini-navaflow-devops-v1',
  useABTesting: false, // Skip A/B testing
});
```

---

## 📊 A/B Test Dashboard

Access at: `/dashboard/ab-test`

**Shows**:
- Response time comparison
- Accuracy ratings
- Token usage
- Request counts
- Per-feature breakdown

---

## 🚀 Deployment Checklist

### Canary Phase (10%)
- [ ] Set `FINETUNED_MODEL_WEIGHT=10`
- [ ] Add canary user IDs
- [ ] Monitor metrics for 1 week
- [ ] Collect SRE feedback

### A/B Testing Phase (50%)
- [ ] Set `FINETUNED_MODEL_WEIGHT=50`
- [ ] Run blind SRE ratings
- [ ] Compare accuracy scores
- [ ] Monitor for 2 weeks

### Full Rollout (100%)
- [ ] Set `FINETUNED_MODEL_WEIGHT=100`
- [ ] Monitor production metrics
- [ ] Collect user feedback
- [ ] Iterate based on results

---

## 💰 Cost Considerations

### Fine-Tuned Model
- **Training**: One-time cost (~$0.10-0.50 for 8 examples)
- **Inference**: ~$0.002 per request
- **Benefit**: Faster resolution, better accuracy

### Base Model
- **Inference**: ~$0.001 per request (cheaper)
- **Trade-off**: Less specialized, generic responses

**Recommendation**: Use fine-tuned for critical incidents, base for general tasks.

---

## ✅ Status

**Custom Model**: `ft:gpt-4o-mini-navaflow-devops-v1` ✅  
**A/B Testing**: Implemented ✅  
**Canary Deployment**: Ready ✅  
**Analytics**: Dashboard ready ✅  

**Ready for canary deployment!** 🚀

---

**Last Updated**: 2024  
**Status**: Canary Deployment Ready ✅
