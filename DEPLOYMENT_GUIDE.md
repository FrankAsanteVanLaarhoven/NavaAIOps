# NavaFlow - Production Deployment Guide

## Overview

This guide covers deploying fine-tuned models to Vercel (Edge Functions) and AWS SageMaker, implementing the full CMDP verification loop, setting up continuous learning, and expanding RL with Reward Modeling (RMAF).

---

## 🚀 Deployment Architecture

### 1. Vercel Edge Functions (Low Latency)

**Models Deployed:**
- **O3-Mini (Controller)**: Fast structured planning
- **GPT-4o-Mini Fine-tuned (Reasoner/Verifier)**: Incident resolution and verification

**Endpoints:**
- `POST /api/ai/plan` - CMDP planning
- `POST /api/ai/resolve` - Incident resolution

**Configuration:**
- Runtime: Edge (Vercel Edge Functions)
- Max Duration: 30 seconds
- Memory: 128 MB

### 2. AWS SageMaker (Heavy Compute)

**Models Deployed:**
- **RL PPO Agent**: Reinforcement learning for self-correction

**Endpoint:**
- `POST /api/ai/rl/reward` - Reward prediction

**Configuration:**
- Instance Type: `ml.m5.xlarge` (or `ml.g4dn.xlarge` for GPU)
- Container: Custom Docker image
- Port: 8080

---

## 📋 Prerequisites

### Environment Variables

```env
# OpenAI
OPENAI_API_KEY="sk-..."
FINETUNED_MODEL_ID="ft:gpt-4o-mini-navaflow-devops-v1"
REWARD_MODEL_ID="ft:gpt-4o-mini-navaflow-reward-v1"

# OpenRouter (if using)
OPENROUTER_API_KEY="sk-or-..."

# AWS SageMaker
SAGEMAKER_ENDPOINT="https://runtime.sagemaker.us-east-1.amazonaws.com/endpoints/rl-ppo-agent/invocations"
AWS_REGION="us-east-1"
AWS_ACCESS_KEY_ID="..."
AWS_SECRET_ACCESS_KEY="..."

# Vercel Cron
CRON_SECRET="your-secret-key"

# Database
DATABASE_URL="postgresql://..."
```

---

## 🔧 Step-by-Step Deployment

### Step 1: Deploy Vercel Edge Functions

1. **Push code to GitHub:**
```bash
git add .
git commit -m "feat: Add Vercel Edge Functions for CMDP planning and resolution"
git push origin main
```

2. **Vercel will auto-deploy:**
- Edge functions are automatically detected via `export const runtime = 'edge'`
- Functions are deployed to Vercel's global edge network

3. **Verify deployment:**
```bash
curl -X POST https://your-app.vercel.app/api/ai/plan \
  -H "Content-Type: application/json" \
  -d '{"context": {"incident": "test"}, "incidentId": "test-123"}'
```

### Step 2: Deploy AWS SageMaker Endpoint

1. **Build Docker image:**
```bash
docker build -t navaflow-rl-agent -f Dockerfile.sagemaker .
```

2. **Tag and push to ECR:**
```bash
# Get AWS account ID
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

# Create ECR repository
aws ecr create-repository --repository-name navaflow-rl-agent --region us-east-1

# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.us-east-1.amazonaws.com

# Tag image
docker tag navaflow-rl-agent:latest ${AWS_ACCOUNT_ID}.dkr.ecr.us-east-1.amazonaws.com/navaflow-rl-agent:latest

# Push image
docker push ${AWS_ACCOUNT_ID}.dkr.ecr.us-east-1.amazonaws.com/navaflow-rl-agent:latest
```

3. **Create SageMaker Model:**
```bash
aws sagemaker create-model \
  --model-name navaflow-rl-agent \
  --primary-container Image=${AWS_ACCOUNT_ID}.dkr.ecr.us-east-1.amazonaws.com/navaflow-rl-agent:latest \
  --execution-role-arn arn:aws:iam::${AWS_ACCOUNT_ID}:role/SageMakerExecutionRole
```

4. **Create Endpoint Configuration:**
```bash
aws sagemaker create-endpoint-config \
  --endpoint-config-name navaflow-rl-agent-config \
  --production-variants VariantName=AllTraffic,ModelName=navaflow-rl-agent,InitialInstanceCount=1,InstanceType=ml.m5.xlarge
```

5. **Create Endpoint:**
```bash
aws sagemaker create-endpoint \
  --endpoint-name navaflow-rl-agent \
  --endpoint-config-name navaflow-rl-agent-config
```

6. **Wait for endpoint to be ready:**
```bash
aws sagemaker wait endpoint-in-service --endpoint-name navaflow-rl-agent
```

7. **Update environment variable:**
```env
SAGEMAKER_ENDPOINT="https://runtime.sagemaker.us-east-1.amazonaws.com/endpoints/navaflow-rl-agent/invocations"
```

### Step 3: Set Up Continuous Learning

1. **Configure Vercel Cron:**
   - The cron job is configured in `vercel.json`
   - Runs daily at 2 AM UTC
   - Endpoint: `/api/cron/retraining`

2. **Set CRON_SECRET:**
```bash
# In Vercel dashboard or CLI
vercel env add CRON_SECRET
# Enter a secure random string
```

3. **Verify cron job:**
```bash
# Test manually
curl -X GET https://your-app.vercel.app/api/cron/retraining \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### Step 4: Test CMDP Pipeline

1. **Create a test incident:**
```bash
curl -X POST http://localhost:3000/api/incidents \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Incident",
    "severity": "sev-2",
    "status": "investigating"
  }'
```

2. **Execute CMDP pipeline:**
```typescript
import { executeCMDPPipeline } from '@/lib/services/cmdp-pipeline';

const result = await executeCMDPPipeline({
  input: {
    context: { incident: 'test' },
    incidentId: 'incident-123',
    workspaceId: 'default',
  },
});

console.log(result);
```

---

## 🔄 Continuous Learning Pipeline

### How It Works

1. **Data Collection:**
   - Successful CMDP executions are logged to `AuditLog` table
   - Filtered by `tableName: 'CMDP_Execution'` and `status: 'SUCCESS'`

2. **Daily Cron Job:**
   - Runs at 2 AM UTC
   - Fetches last 24 hours of successful resolutions
   - Requires minimum 50 records

3. **Data Formatting:**
   - Converts to JSONL format (OpenAI fine-tuning)
   - One JSON object per line with `messages` array

4. **Fine-Tuning:**
   - Uploads to OpenAI
   - Creates fine-tuning job
   - New model ID is generated (e.g., `ft:gpt-4o-mini-navaflow-devops-v1:continuous-1234567890`)

5. **Model Update:**
   - Update `FINETUNED_MODEL_ID` environment variable
   - Redeploy application

### Manual Trigger

```typescript
import { trpc } from '@/lib/trpc/client';

const result = await trpc.retraining.triggerJob.mutate({
  workspaceId: 'default',
  modelId: 'ft:gpt-4o-mini-navaflow-devops-v1',
});

console.log(result.jobId);
```

### Check Job Status

```typescript
const status = await trpc.retraining.getJobStatus.query({
  jobId: 'ftjob-abc123',
});

console.log(status.status); // 'succeeded', 'running', 'failed'
```

---

## 🎯 Reward Modeling (RMAF)

### Implementation

**Location:** `src/lib/ai/reward-model.ts`

**Purpose:**
- Predict expected reward for proposed actions BEFORE execution
- Makes RL training more sample-efficient
- Reduces need for expensive rollouts

**Usage:**
```typescript
import { getRewardPrediction } from '@/lib/ai/reward-model';

const prediction = await getRewardPrediction({
  input: {
    state: {
      incident: 'Database latency spike',
      severity: 'sev-2',
      actions_taken: [],
    },
    proposedAction: {
      type: 'SCALE_K8S',
      params: { replicas: 3 },
    },
  },
});

console.log(prediction.reward); // -10.0 to +10.0
console.log(prediction.factors); // Breakdown by factor
```

**Integration with RL Loop:**
- Automatically called in `runSelfReflectionEpisode`
- Rewards are saved to JSONL files for PPO training
- Files stored in `tmp/rl-data-*.jsonl`

---

## 📊 Monitoring & Observability

### Vercel Analytics

- **Edge Function Metrics:**
  - Response times
  - Error rates
  - Invocation counts

- **Access:** Vercel Dashboard → Analytics

### SageMaker CloudWatch

- **Endpoint Metrics:**
  - Invocation count
  - Model latency
  - 4xx/5xx errors

- **Access:** AWS Console → CloudWatch → Metrics

### Application Logs

- **CMDP Execution Logs:** Stored in `AuditLog` table
- **RL Episodes:** Stored in `AuditLog` with `tableName: 'ReflectionEpisode'`
- **Fine-tuning Jobs:** Tracked via OpenAI API

---

## 🐛 Troubleshooting

### Edge Function Timeout

**Problem:** Edge function exceeds 30-second limit

**Solution:**
- Reduce context size
- Use streaming responses
- Move heavy compute to SageMaker

### SageMaker Endpoint Not Responding

**Problem:** 503 errors from SageMaker endpoint

**Solution:**
```bash
# Check endpoint status
aws sagemaker describe-endpoint --endpoint-name navaflow-rl-agent

# Check CloudWatch logs
aws logs tail /aws/sagemaker/Endpoints/navaflow-rl-agent --follow
```

### Fine-tuning Job Fails

**Problem:** OpenAI fine-tuning job fails

**Solution:**
- Check JSONL format (one JSON per line)
- Verify minimum 50 examples
- Check OpenAI API quota
- Review job status: `trpc.retraining.getJobStatus.query({ jobId })`

### CMDP Pipeline Fails

**Problem:** Pipeline returns `status: 'failed'`

**Solution:**
- Check compliance violations in response
- Verify incident exists in database
- Check API endpoint availability
- Review logs for specific error messages

---

## 🔒 Security Considerations

1. **API Keys:**
   - Store in Vercel environment variables
   - Never commit to repository
   - Rotate regularly

2. **Cron Secret:**
   - Use strong random string
   - Store in Vercel environment variables
   - Verify in cron endpoint

3. **SageMaker IAM:**
   - Use least-privilege IAM roles
   - Enable VPC endpoints for private access
   - Enable encryption at rest

4. **Database:**
   - Use connection pooling
   - Enable SSL/TLS
   - Regular backups

---

## 📈 Performance Optimization

### Edge Functions

- **Cache responses** for identical queries
- **Stream responses** for long-running operations
- **Use CDN** for static assets

### SageMaker

- **Auto-scaling:** Configure endpoint auto-scaling
- **Instance selection:** Use GPU instances for large models
- **Batch inference:** For high-throughput scenarios

### Database

- **Connection pooling:** Use Neon connection pooling
- **Indexes:** Add indexes for frequent queries
- **Query optimization:** Use Prisma query optimization

---

## 🎉 Success Criteria

✅ **Edge Functions:**
- Response time < 2 seconds
- Error rate < 1%
- 99.9% uptime

✅ **SageMaker:**
- Endpoint latency < 500ms
- Availability > 99.9%
- Cost < $100/month

✅ **Continuous Learning:**
- Daily retraining jobs succeed
- Model performance improves over time
- No data quality issues

✅ **CMDP Pipeline:**
- Compliance score > 0.8
- Execution success rate > 95%
- Average resolution time decreases

---

## 📚 Additional Resources

- [Vercel Edge Functions Docs](https://vercel.com/docs/functions/edge-functions)
- [AWS SageMaker Docs](https://docs.aws.amazon.com/sagemaker/)
- [OpenAI Fine-tuning Guide](https://platform.openai.com/docs/guides/fine-tuning)
- [CMDP Architecture](./CMDP_ARCHITECTURE.md)

---

**Last Updated:** 2024-12-30
**Version:** 1.0.0
