# Background Jobs

This directory contains background jobs for the Survey Builder API.

## Available Jobs

### 1. Send Survey Invitations Job

**File**: `sendSurveyInvitations.job.ts`

**Purpose**: Automatically send email invitations to respondents who have pending invitations.

**Features**:
- ✅ Queries `SurveyRespondents` for invitations with `status='pending'`
- ✅ Only processes invitations for active surveys (`live` or `published`)
- ✅ Only sends to active, non-archived respondents
- ✅ Sends emails via existing `sendSurveyInvite` utility
- ✅ Updates invitation status to `sent` on success or `failed` on error
- ✅ Records `sentAt` timestamp
- ✅ **Duplicate prevention**: Compound unique index `(surveyId + respondentId)` ensures no duplicate invitations
- ✅ Batch processing with configurable batch size (default: 10)
- ✅ Rate limiting with delay between batches (1 second)
- ✅ Comprehensive logging and error handling

---

## Running Jobs

### Method 1: CLI Script (Recommended for Cron)

```bash
# From api directory
npm run job:send-invitations

# Or with ts-node directly
ts-node src/jobs/sendSurveyInvitations.job.ts
```

**Output Example**:
```
Connected to MongoDB
Starting SendSurveyInvitations job
Found pending invitations { count: 15 }
Processing invitation batch { batchSize: 10 }
Invitation sent successfully { surveyId: '...', respondentId: '...', email: 'user@example.com' }
...
SendSurveyInvitations job completed { totalProcessed: 15, successCount: 14, failedCount: 1 }

========================================
Send Survey Invitations Job - Complete
========================================
Total Processed: 15
Successfully Sent: 14
Failed: 1
========================================

Failed Invitations:
  - invalid@example.com: SMTP error
```

### Method 2: HTTP API Endpoint (Manual Trigger)

```bash
# Login first to get auth cookie
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}' \
  -c cookies.txt

# Trigger job
curl -X POST http://localhost:3001/api/jobs/send-invitations \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"batchSize": 20}'
```

**Response Example**:
```json
{
  "success": true,
  "message": "Send invitations job completed successfully",
  "result": {
    "totalProcessed": 15,
    "successCount": 14,
    "failedCount": 1,
    "failedInvitations": [
      {
        "surveyId": "...",
        "respondentId": "...",
        "email": "invalid@example.com",
        "error": "SMTP error: Invalid recipient"
      }
    ]
  }
}
```

### Method 3: Programmatic (In Code)

```typescript
import { SendSurveyInvitationsJob } from './jobs/sendSurveyInvitations.job';

const job = new SendSurveyInvitationsJob();
job.setBatchSize(20); // Optional: set custom batch size
const result = await job.execute();
console.log(result);
```

---

## Scheduling Jobs

### Using Cron (Linux/Mac)

Add to crontab (`crontab -e`):

```bash
# Run every 5 minutes
*/5 * * * * cd /path/to/survey_app_builder/apps/api && npm run job:send-invitations >> /var/log/send-invitations.log 2>&1

# Run every hour at minute 0
0 * * * * cd /path/to/survey_app_builder/apps/api && npm run job:send-invitations

# Run every day at 9 AM
0 9 * * * cd /path/to/survey_app_builder/apps/api && npm run job:send-invitations
```

### Using Windows Task Scheduler

1. Open Task Scheduler
2. Create Basic Task
3. Set trigger (e.g., Daily, Hourly)
4. Action: Start a program
   - Program: `cmd.exe`
   - Arguments: `/c cd /d D:\survey_app_builder\apps\api && npm run job:send-invitations`

### Using Node Cron (In-App Scheduler)

Add to `src/index.ts`:

```typescript
import cron from 'node-cron';
import { SendSurveyInvitationsJob } from './jobs/sendSurveyInvitations.job';

// Run every 5 minutes
cron.schedule('*/5 * * * *', async () => {
  log.info('Running scheduled send invitations job', 'CRON');
  try {
    const job = new SendSurveyInvitationsJob();
    const result = await job.execute();
    log.info('Scheduled job completed', 'CRON', { result });
  } catch (error: any) {
    log.error('Scheduled job failed', 'CRON', { error: error.message });
  }
});
```

Then install: `npm install node-cron @types/node-cron`

### Using Cloud Services

#### Heroku Scheduler
1. Install Heroku Scheduler add-on
2. Add job command: `npm run job:send-invitations`
3. Set frequency (every 10 minutes, hourly, daily)

#### AWS CloudWatch Events
1. Create Lambda function that calls your API endpoint
2. Set CloudWatch rule with schedule expression
3. Target: Your Lambda function

#### Google Cloud Scheduler
1. Create Cloud Scheduler job
2. Target: HTTP endpoint (`POST /api/jobs/send-invitations`)
3. Add authentication headers

---

## Monitoring & Observability

### Check Pending Invitations Count

```bash
curl -X GET http://localhost:3001/api/jobs/pending-invitations/count \
  -b cookies.txt
```

**Response**:
```json
{
  "pendingInvitations": 42
}
```

### View Logs

Jobs use the Winston logger configured in `src/logger.ts`.

**Log Locations**:
- Console output (dev mode)
- MongoDB (if configured)
- File logs (if configured)

**Example Log Entries**:
```json
{
  "level": "info",
  "message": "Starting SendSurveyInvitations job",
  "method": "SendSurveyInvitationsJob",
  "timestamp": "2025-10-23T12:00:00.000Z"
}
{
  "level": "info",
  "message": "Invitation sent successfully",
  "method": "sendInvitation",
  "surveyId": "...",
  "respondentId": "...",
  "email": "user@example.com",
  "timestamp": "2025-10-23T12:00:05.000Z"
}
```

### Query Invitation Status

```javascript
// In MongoDB shell or Compass
db.surveyrespondents.aggregate([
  { $unwind: "$invitations" },
  { $group: {
      _id: "$invitations.status",
      count: { $sum: 1 }
    }
  }
])

// Result:
// { _id: "pending", count: 42 }
// { _id: "sent", count: 158 }
// { _id: "failed", count: 3 }
```

---

## How Duplicate Prevention Works

The `SurveyRespondents` model has a **compound unique index** on:
```
(surveyId + invitations.respondentId)
```

This ensures:
- ✅ A respondent can only have ONE invitation per survey
- ✅ If you try to add the same respondent twice, MongoDB prevents it
- ✅ The job will only process each invitation once
- ✅ Retries are safe - failed invitations stay `pending` and will be retried

**Example**:
```typescript
// First call - creates invitation with status='pending'
await surveyRespondentsService.mergeRecipients(surveyId, [respondentId], []);

// Job runs - updates to status='sent'
await job.execute();

// Second call to mergeRecipients - updates SAME invitation (no duplicate)
await surveyRespondentsService.mergeRecipients(surveyId, [respondentId], []);
```

---

## Retry Logic

### Automatic Retries

Failed invitations (status='failed') are **NOT** automatically retried by the job.

To retry failed invitations, you need to manually update their status:

```javascript
// In MongoDB shell
db.surveyrespondents.updateMany(
  { "invitations.status": "failed" },
  { $set: { "invitations.$[elem].status": "pending" } },
  { arrayFilters: [{ "elem.status": "failed" }] }
)
```

### Manual Retry via API

You can also re-run `mergeRecipients` which will preserve the existing invitation:

```bash
curl -X PATCH http://localhost:3001/api/surveys/SURVEY_ID/respondents \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"respondentIds": ["FAILED_RESPONDENT_ID"], "groupIds": []}'
```

---

## Error Handling

### Common Errors

#### 1. SMTP Configuration Missing
```
Error: SMTP_USER or SMTP_PASS not configured
```
**Solution**: Set environment variables in `.env`

#### 2. Invalid Email Address
```
Error: Invalid email format
```
**Solution**: Validate emails when importing respondents

#### 3. Survey Not Live
**Behavior**: Job skips invitations for non-live surveys
**Solution**: Change survey status to `live` or `published`

#### 4. Respondent Archived
**Behavior**: Job skips archived respondents
**Solution**: Un-archive respondent if needed

### Job Failures

If the job crashes completely:
1. Check logs for error details
2. Verify database connection
3. Check email service status
4. Ensure environment variables are set

Pending invitations will remain `pending` and can be processed in the next run.

---

## Performance Considerations

### Batch Size

Default: 10 invitations per batch

**Adjust based on**:
- Email service rate limits (e.g., Gmail: 500/day)
- Server resources
- Desired throughput

```typescript
job.setBatchSize(20); // Process 20 at a time
```

### Rate Limiting

Default: 1 second delay between batches

**Modify in code**:
```typescript
// In sendSurveyInvitations.job.ts
await this.delay(2000); // 2 second delay
```

### Database Queries

The job uses efficient aggregation pipeline with indexes:
- `invitations.status` - filter pending
- `survey.status` - filter active surveys
- `respondent.accountEnabled` - filter active accounts

Ensure these indexes exist for optimal performance.

---

## Testing

### Test with Mock Email

Set environment variable to use mock email sender:

```bash
# In .env
SMTP_USER=test@example.com
SMTP_PASS=test-password
NODE_ENV=test
```

Or stub the email function in tests:

```typescript
import * as emailUtils from '../utils/email';

jest.spyOn(emailUtils, 'sendSurveyInvite').mockResolvedValue();
```

### Test Job Execution

```typescript
import { SendSurveyInvitationsJob } from './sendSurveyInvitations.job';
import { SurveyRespondents } from '../models/SurveyRespondents';

describe('SendSurveyInvitationsJob', () => {
  it('should process pending invitations', async () => {
    // Setup test data
    const surveyRespondent = await SurveyRespondents.create({
      surveyId: testSurveyId,
      allowedRespondents: [respondentId],
      invitations: [{
        respondentId: respondentId,
        status: 'pending',
        sentAt: new Date()
      }]
    });

    // Run job
    const job = new SendSurveyInvitationsJob();
    const result = await job.execute();

    // Assertions
    expect(result.totalProcessed).toBe(1);
    expect(result.successCount).toBe(1);
    
    // Verify status updated
    const updated = await SurveyRespondents.findById(surveyRespondent._id);
    expect(updated.invitations[0].status).toBe('sent');
  });
});
```

---

## Future Enhancements

- [ ] Add support for email templates with personalization
- [ ] Implement exponential backoff for failed invitations
- [ ] Add webhook notifications for completed jobs
- [ ] Support for SMS invitations
- [ ] Dashboard for monitoring job status
- [ ] Configurable retry policies
- [ ] Email delivery tracking (opens, clicks)
- [ ] Batch size auto-tuning based on success rate

---

## Troubleshooting

### Job Runs But No Emails Sent

**Check**:
1. Are there pending invitations? `GET /api/jobs/pending-invitations/count`
2. Is survey status `live` or `published`?
3. Are respondents `accountEnabled=true` and `isArchived=false`?
4. Check SMTP configuration

### Invitations Stuck in Pending

**Possible causes**:
- Job not running (check cron/scheduler)
- Email service down (check SMTP connection)
- Job crashed (check logs)

**Solution**:
Run job manually: `npm run job:send-invitations`

### High Failure Rate

**Check**:
- Email addresses validity
- SMTP daily limits not exceeded
- Network connectivity
- Email service status

### Job Takes Too Long

**Solutions**:
- Increase batch size: `job.setBatchSize(50)`
- Reduce delay between batches
- Use async email service (queue-based)
- Optimize database queries

---

## Questions?

- Check main `IMPLEMENTATION_SUMMARY.md`
- Check `API_ROUTES_SUMMARY.md` for API endpoints
- Review Winston logs for debugging
- Test with manual trigger: `POST /api/jobs/send-invitations`

