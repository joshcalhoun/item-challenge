# Architecture Documentation

## Data Model Design

### DynamoDB Single-Table Design

The application uses a single DynamoDB table (`ExamItems`) following the single-table design pattern. This minimizes the number of tables to manage, reduces round-trips for related data access, and aligns with DynamoDB best practices for cost and performance at this project's scope.

**Billing Mode:** PAY_PER_REQUEST (on-demand) — no capacity planning required, costs scale linearly with actual usage.

**Point-in-Time Recovery:** Enabled for data protection against accidental deletes or writes.

### Key Design

| Key | Format | Purpose |
|-----|--------|---------|
| `PK` (Partition Key) | `ITEM#<uuid>` | Groups all records for a single item |
| `SK` (Sort Key) | `CURRENT` or `VERSION#<zero-padded number>` | Distinguishes the live record from version snapshots |

This composite key design supports two core access patterns on the primary table:

1. **Get current item by ID** — `GetItem` with `PK=ITEM#<id>, SK=CURRENT`
2. **Get version history** — `Query` with `PK=ITEM#<id>, SK begins_with VERSION#`

The zero-padded version number (e.g., `VERSION#000001`) ensures versions sort lexicographically in the correct order.

### GSI Strategy

| Index | Partition Key | Sort Key | Projection | Purpose |
|-------|--------------|----------|------------|---------|
| `SubjectStatusIndex` | `subject` | `SK` | ALL | Query items by subject, filtering to `CURRENT` records only |
| `EntityTypeIndex` | `SK` | — | ALL | List all `CURRENT` items without a full table scan |

**SubjectStatusIndex** enables the "list items by subject" access pattern. By using `SK` as the sort key, queries can filter to only `CURRENT` records (`SK = 'CURRENT'`) and exclude version snapshots. Additional filtering by `metadata.status` is applied as a `FilterExpression`.

**EntityTypeIndex** inverts the sort key as a partition key so that querying `SK = 'CURRENT'` returns all live items. This avoids a full table `Scan` for the unfiltered list operation.

### Item Schema

```typescript
{
  id: string;                    // UUID v4
  subject: string;               // e.g., "AP Biology"
  itemType: string;              // "multiple-choice" | "free-response" | "essay"
  difficulty: number;            // 1–5 (integer)
  content: {
    question: string;
    options?: string[];           // Required for multiple-choice (≥2)
    correctAnswer: string;
    explanation: string;
  };
  metadata: {
    author: string;
    created: number;             // Unix timestamp (ms)
    lastModified: number;        // Unix timestamp (ms)
    version: number;             // Auto-incrementing
    status: string;              // "draft" | "review" | "approved" | "archived"
    tags: string[];
  };
  securityLevel: string;         // "standard" | "secure" | "highly-secure"
}
```

### Access Patterns Summary

| Access Pattern | Operation | Key/Index Used |
|---------------|-----------|---------------|
| Create item | `PutItem` × 2 (CURRENT + VERSION#1) | Primary key |
| Get item by ID | `GetItem` | Primary key (`PK`, `SK=CURRENT`) |
| Update item | `GetItem` + `PutItem` × 2 (CURRENT + new VERSION) | Primary key |
| List all items | `Query` | EntityTypeIndex (`SK=CURRENT`) |
| List by subject | `Query` | SubjectStatusIndex (`subject`, `SK=CURRENT`) |
| Create version | `GetItem` + `PutItem` × 2 | Primary key |
| Get audit trail | `Query` (`begins_with`) | Primary key (`PK`, `SK begins_with VERSION#`) |

---

## Infrastructure Choices

### Why Serverless (Lambda + API Gateway + DynamoDB)

The serverless stack was chosen for three reasons:

1. **Cost efficiency** — PAY_PER_REQUEST DynamoDB and Lambda's per-invocation billing mean zero cost at idle. For a variable-traffic CRUD API, this is significantly cheaper than running ECS/Fargate with RDS.
2. **Operational simplicity** — No servers to patch, no capacity to plan, no scaling policies to tune. Auto-scaling is built into every layer.
3. **Workload fit** — Exam item management is a request-driven, stateless CRUD workload with variable traffic. This is the canonical serverless use case.

### Service Configuration

| Service | Configuration | Rationale |
|---------|--------------|-----------|
| **Lambda** | Node.js 22.x, 256 MB, 10s timeout | Minimal runtime for a CRUD API; 256 MB provides adequate CPU for JSON serialization |
| **API Gateway** | REST API, 100 req/s rate limit, 200 burst | Managed throttling protects downstream resources without custom logic |
| **DynamoDB** | On-demand, PITR enabled, customer-managed KMS key, DESTROY removal | On-demand avoids capacity planning; PITR for safety; CMK for encryption control and audit via CloudTrail; DESTROY for non-production teardown |
| **CloudWatch Logs** | JSON format, 2-week retention | Structured logs enable CloudWatch Insights queries; 2 weeks balances cost with operational needs |

### Infrastructure as Code

All infrastructure is defined in AWS CDK (TypeScript) in `infrastructure/lib/infrastructure-stack.ts`. CDK was chosen over raw CloudFormation for type safety and conciseness. The stack is a single self-contained unit — appropriate for this scope, though a production system would split into separate stacks (database, compute, API).

### Storage Abstraction

The `ItemStorage` interface (`src/storage/interface.ts`) enables a factory pattern:

- **DynamoDBStorage** — used in production (`USE_DYNAMODB=true`)
- **MemoryStorage** — used for local development and unit testing

This allows running and testing the full application locally with no AWS dependencies.

---

## Scalability

### What Scales Well

- **Lambda** scales horizontally to 1,000 concurrent executions by default (adjustable). Each request runs in an isolated execution environment.
- **DynamoDB on-demand** scales to accommodate traffic spikes without pre-provisioning. Single-digit millisecond latency is maintained regardless of table size.
- **API Gateway** handles traffic bursts natively and provides throttling as a safety valve.
- **Stateless handlers** — no shared state between invocations, so scaling is purely horizontal.

### Pagination

The `listItems` operation uses cursor-based pagination backed by DynamoDB's native `Limit` and `ExclusiveStartKey`/`LastEvaluatedKey`. Each response includes an opaque `cursor` token (base64url-encoded `LastEvaluatedKey`) that the client passes on the next request to retrieve the following page. This ensures DynamoDB only reads the items needed for the requested page, regardless of total dataset size.

### Other Scalability Considerations

- **Hot partitions** — The `EntityTypeIndex` GSI has `SK=CURRENT` as its partition key, meaning all current items share a single partition. At very high item counts (>10K) or very high read rates, this could become a hot partition. A mitigation would be to add a synthetic shard key.
- **Write amplification** — Every create/update writes two DynamoDB items (CURRENT + VERSION snapshot). This doubles write costs but is acceptable for an audit-trail requirement.
- **Lambda cold starts** — Node.js 22.x cold starts are typically ~100–200ms. For latency-sensitive use cases, provisioned concurrency could be added.

---

## Security

### Current State

Authentication and authorization were scoped out for this challenge. The API is currently open with permissive CORS (`Access-Control-Allow-Origin: *`).

### Production Security Roadmap

**Authentication & Authorization:**
- Add a resource policy to the API Gateway to restrict access to known consumers (VPCs, accounts, IP ranges)
- Depending on the consumer, add either **Cognito user pool authorizers** (for end-user applications) or **IAM authorization** (for service-to-service calls)
- Restrict CORS to specific allowed origins

**Network Protection:**
- Add **CloudFront** as a CDN and entry point
- Attach **AWS WAF** to CloudFront for DDoS protection, rate limiting, and common exploit filtering (SQL injection, XSS)
- Disable the API Gateway default endpoint so all traffic flows through CloudFront/WAF

**Encryption:**
- DynamoDB is encrypted at rest using a **customer-managed KMS key** (`exam-items-table-key`) with automatic annual key rotation enabled
- API Gateway enforces HTTPS for all traffic in transit

**IAM:**
- Lambda functions use least-privilege IAM roles granted through CDK's `grantReadData()`, `grantWriteData()`, and `grantReadWriteData()` methods
- KMS permissions are scoped per function: read-only Lambdas receive `kms:Decrypt`, write-only Lambdas receive `kms:Encrypt`, and read-write Lambdas receive both
- Read-only handlers (getItem, listItems, getAuditTrail) only receive read permissions
- Write handlers receive only the permissions they need

### Input Validation

All inputs are validated at the API boundary using Zod schemas before reaching business logic:
- UUID format validation for item IDs
- Enum enforcement for `itemType`, `status`, `securityLevel`
- Range validation for `difficulty` (1–5) and `limit` (1–100)
- Custom validation rules (e.g., multiple-choice items must have ≥2 options)

---

## Trade-offs

### What Was Prioritized

The primary goal was **meeting the Getting Started guidelines completely** — implementing all required CRUD operations, versioning, audit trail, validation, error handling, and infrastructure-as-code with a working deployment.

### What Was Deprioritized

| Area | Current State | What I'd Add |
|------|--------------|-------------|
| **Pagination** | Cursor-based using `LastEvaluatedKey` | Cursor encryption to avoid leaking internal key structure to clients |
| **Observability** | Structured JSON logs + API access logs | AWS X-Ray distributed tracing, CloudWatch alarms on error rates/latency, custom metrics dashboards |
| **Security** | Open API, permissive CORS | CloudFront + WAF, Cognito/IAM auth, resource policies, restricted CORS, disabled default endpoint |
| **CI/CD** | Manual `cdk deploy` | Automated pipeline (CodePipeline or GitHub Actions) with testing, staging, and production stages |
| **Testing** | Unit tests with in-memory storage | Integration tests against DynamoDB Local, load testing, contract testing for API consumers |
| **Error handling** | Structured error responses | Dead letter queues for failed async operations, retry logic with exponential backoff |

### Design Decisions

- **Single-table design** over multi-table — fewer resources to manage, lower cost, supports all current access patterns. Trade-off: more complex key design and queries.
- **Full item snapshots for versions** over storing diffs — simpler to implement and query, but uses more storage. At exam-item scale (KB per item, low version counts), storage cost is negligible.
- **In-memory storage for local dev** over DynamoDB Local — faster feedback loop, zero dependencies. Trade-off: doesn't catch DynamoDB-specific issues during local testing.
- **REST API Gateway** over HTTP API — REST API provides built-in request validation, WAF integration, and usage plans. Trade-off: slightly higher latency and cost per request compared to HTTP API.
