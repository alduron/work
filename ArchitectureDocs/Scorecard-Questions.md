# Architecture Modernization Scorecard Questions

Use these questions during interviews with each application manager. For each tenet, the questions are designed to help you determine whether the application is at Level 0 (Not Started), Level 1 (Foundational), Level 2 (Adopted), or Level 3 (Optimized). Ask follow-up questions where needed and request evidence (documents, dashboards, configs, code) to validate the answers.

---

## Tenet 1: Domain-Driven Architecture

**Bounded Contexts and Ownership**

1. Can you show me a diagram or document that identifies the bounded contexts (major business capability areas) within your application?
2. Does every bounded context have a clearly assigned owning team? Who owns what?
3. Do you have a glossary of business terms for each context, and has the business reviewed it?

**Domain Boundaries in Code**

4. Are domain boundaries enforced in code (separate modules, packages, or services with restricted access), or are they documented but not enforced?
5. Can a developer in one domain accidentally call into another domain's internal classes or query another domain's database tables directly?
6. Is there a check during code review for domain boundary violations?

**Data Ownership**

7. Is there a documented registry showing which domain owns which database tables?
8. Are there any cases where one domain writes directly to another domain's tables?
9. Are there any cases where one domain reads directly from another domain's tables, bypassing any public interface?

**Cross-Domain Communication**

10. How do your domains communicate with each other? Is it through defined interfaces (APIs, events, module contracts), or through direct method calls and shared database access?
11. Do you use domain events for any cross-context communication today?
12. Do you have a context map, and when was it last updated?

---

## Tenet 2: Data Modeling and Schema Discipline

**Schema Management**

1. Do you use a versioned schema migration tool (Flyway, Liquibase, EF Migrations, or similar) for all database changes?
2. Are all schema changes captured in version control, or do any changes get applied manually in production?
3. Do your database tables and columns follow a documented naming convention?

**Data Ownership and Authority**

4. For each major data entity your application manages, can you tell me whether your application is the authoritative source, or whether it receives that data from another system?
5. Is there any case where another application connects directly to your database, or where you connect directly to another application's database?
6. For shared data entities that multiple applications care about, is the authoritative application clearly identified and documented?

**Published Schemas and Contracts**

7. For data you publish to other systems (via APIs, events, or files), do you have documented schemas with field names, types, and required/optional status?
8. Are your published schemas stored in a shared registry or versioned repository where other teams can discover them?
9. Do you validate incoming data against an expected schema before persisting or processing it?

**Schema Evolution**

10. When you make a schema change to published data, do you follow backward-compatible evolution practices?
11. When a breaking change is unavoidable, do you have a documented migration plan with a consumer timeline?
12. Do schema changes that affect data used in regulatory reporting get reviewed with compliance before deployment?

**Discovery and Documentation**

13. Do you have a data dictionary or catalog that other teams can reference?
14. Do you run consumer-driven contract tests to verify that your schema changes do not break downstream consumers?

---

## Tenet 3: Event-Driven Data Flow

**Event Catalog and Design**

1. Do you have a documented catalog of the domain events your application produces and consumes?
2. Do your events follow a consistent naming convention (past tense, domain language)?
3. Do your events include a unique event ID, timestamp, correlation ID, and schema version?

**Messaging Infrastructure**

4. Are you using any form of event-based communication today, even if it is just an in-process event bus within your application?
5. If your application communicates with other separately deployed applications, do those integrations use a message broker (Kafka, RabbitMQ, Azure Service Bus), or are they all synchronous API calls?
6. Do you have dead letter queues or equivalent error handling configured for async processing? Are they monitored?

**Consumer Resilience**

7. Are your event handlers idempotent? Can they safely process the same event twice without causing unintended side effects?
8. Can your consumers handle events arriving out of order?

**Observability**

9. Do correlation IDs flow through all events in a business process so you can trace an action from start to finish?
10. Do you have monitoring and alerting in place for event processing lag, error rates, and consumer health?

**Sensitive Data**

11. Are there any events that carry PII or sensitive financial data? If so, how is that data handled (tokenized, encrypted, or replaced with references)?

**Legacy Integration**

12. Do you have synchronous service-to-service calls that could be replaced by events? Are they documented as technical debt?

---

## Tenet 4: API-First Contracts

**API Specifications**

1. Do your APIs have machine-readable contracts (OpenAPI, Protobuf, AsyncAPI)?
2. How many of your APIs have formal specs versus how many are undocumented or documented only on a wiki?
3. When building a new API, do you write the contract first before implementation, or do you build the implementation and document it afterward?

**Versioning**

4. Are your APIs versioned (for example, `/v1/` in the URL path)?
5. When you make a breaking change, do you run both versions in parallel and give consumers a migration window?
6. Do deprecated API versions return deprecation headers (like a Sunset header) in their responses?

**Contract Testing**

7. Do you run contract tests in your CI pipeline to verify that your API responses match the published spec?
8. Do any of your consumers publish contracts describing what they expect from you (consumer-driven contract testing)?

**API Catalog and Discovery**

9. Are your API specs published to a shared catalog where other teams can find them?
10. Does each API have a documented owner who is responsible for the contract, versioning, and consumer communication?

**Integration Practices**

11. Is there any team that integrates with your application by directly accessing your database instead of going through your API?
12. Do your API responses use a consistent error format (machine-readable error code, human-readable message, correlation ID)?

---

## Tenet 5: Modular Code and Test Coverage

**Code Structure**

1. Can you describe the major modules or functional areas in your application? Are they documented?
2. Is your business logic separated from infrastructure concerns (databases, HTTP, messaging), or is it interleaved?
3. Do your modules have defined public interfaces, or can any code reach into any other module's internals?
4. Do you use dependency injection, or do classes create their own dependencies internally?

**Unit Testing**

5. Do all new features and business logic changes come with unit tests?
6. What is your current unit test coverage for business logic? Do you have a target?
7. Can your unit tests run without a database, network, or file system connection?
8. How long does your full test suite take to run?

**Integration Testing**

9. Do you have integration tests for your database repository implementations and external API client wrappers?
10. Do your tests run automatically in CI on every pull request, and does a test failure block the merge?

**Code Quality**

11. Do you enforce any code quality rules, such as maximum class size, no circular dependencies, or dependency direction checks?
12. Are there any "God classes" in your application (classes over 500 lines that handle multiple unrelated things)?
13. Is there any critical business logic embedded in stored procedures that cannot be unit tested?

**Legacy and Technical Debt**

14. Do you have a documented target code structure that the team is working toward?
15. Are you actively refactoring legacy code toward that target, or is legacy code left untouched?

---

## Tenet 6: Data Freshness and Access Patterns

**Data Flow Mapping**

1. Can you tell me every data source your application depends on, how that data gets to you (batch, API, event, manual), and how old it typically is when you use it?
2. For each data source, do you have a documented freshness requirement that the business has agreed to?
3. Where are the biggest gaps between how fresh the data is and how fresh it needs to be?

**Batch vs. Real-Time**

4. How many of your data feeds are batch (nightly or less frequent)?
5. Have you replaced any batch feeds with near-real-time alternatives (events, CDC, frequent API polling)?
6. For the batch feeds that remain, is that a deliberate choice with business justification, or has nobody gotten around to replacing them?

**Read/Write Separation**

7. Is your read logic separated from your write logic in code (different classes or modules)?
8. Do you use any dedicated read models, materialized views, or caches for high-traffic read paths?
9. Are there any high-traffic read operations that require joins across more than 3 tables?

**Freshness Visibility**

10. Can your application tell a consumer how old the data is right now? Do you expose "as of" or "last updated" timestamps?
11. Do you monitor data freshness and alert when a read model or data feed falls behind its agreed threshold?

**Caching**

12. If you use caching, do your caches have explicit TTLs and invalidation rules, or could they silently serve stale data?

**Rebuildability**

13. If you lost a read model or projection, do you have a documented process to rebuild it from the source of truth?

---

## Tenet 7: Observability-Driven Systems

**Logging**

1. Are your application logs structured and machine-readable (JSON or equivalent), or are they free-text?
2. Do all log entries include a correlation ID that can trace a request across all components involved?
3. Do your logs flow to a centralized log aggregation platform, or do they only exist on the servers?
4. Can every developer on your team access the log platform and run queries without filing a ticket?

**Metrics**

5. Do you collect and display the four golden signals (request rate, error rate, latency, saturation) for your primary entry points?
6. Do you track any business-level metrics (processing volume, success rates, average completion time)?
7. Do you have at least one dashboard for your application?

**Tracing**

8. Do you have distributed tracing across your service calls? Can you follow a single request from start to finish across all the systems it touches?
9. Is trace context propagated through asynchronous messaging (not just synchronous HTTP calls)?

**SLOs and Alerting**

10. Have you defined SLOs for your critical user journeys (for example, "99.9% of requests complete successfully within 2 seconds")?
11. Are your alerts based on SLO burn rates, or are they based on static thresholds?
12. Does every production alert have a corresponding runbook that describes how to investigate and respond?

**Sensitive Data and Retention**

13. Is there any PII or sensitive data appearing in your logs, metrics labels, or trace attributes in plaintext?
14. Do your log retention periods meet the firm's regulatory requirements?

**Operational Maturity**

15. When a production incident occurs, can your team diagnose the issue using your observability tooling, or do they need to SSH into servers or run ad-hoc queries?

---

## Tenet 8: CI/CD and Independent Deployability

**Pipeline Basics**

1. Do you have a CI pipeline that builds and runs automated tests on every code change (commit or pull request)?
2. What automated quality gates are in your pipeline (unit tests, integration tests, static analysis, security scanning)?
3. Does a failing test or security scan block the deployment?

**Deployment Automation**

4. Is your deployment to production fully automated, or are there manual steps?
5. If there are manual steps, can you describe them?
6. How frequently do you deploy to production (daily, weekly, monthly, quarterly)?

**Environment Management**

7. Are your environments provisioned through infrastructure as code, or were they configured manually?
8. Are your non-production environments reasonably close to production, or are there significant differences?
9. Are build artifacts versioned and immutable (the same binary that passes tests is what deploys to production)?

**Database Migrations**

10. Are database schema changes managed through versioned, automated migration scripts, or are they applied manually?

**Feature Flags**

11. Do you use feature flags to separate deploying code from releasing functionality?
12. If you use feature flags, do you have a process to clean up old flags?

**Rollback**

13. Do you have a documented and tested rollback procedure? How long does a rollback take?
14. Is rollback automated, or does it require manual intervention?

**Independence**

15. Can you deploy your application without coordinating with any other team? Or does your deployment require other applications to deploy at the same time?

**Change Management**

16. Are deployment credentials and secrets managed through a secrets management tool, or are they stored somewhere else?
17. Are production deployments linked to an approved change record as required by the firm's change management policy?

---

## Tenet 9: Cloud-Ready Scalability and Resilience

**Statelessness and Scaling**

1. Is your application stateless? Can any instance be killed or replaced at any time without causing a user-facing outage?
2. How many instances of your application run in production? Is there a single point of failure at the application tier?
3. Does your application scale horizontally (adding instances), or only vertically (bigger server)?
4. Is scaling automatic based on measured metrics, or does someone manually add instances during peak periods?

**Configuration and Portability**

5. Are there any hardcoded server names, IP addresses, or environment-specific file paths in your application code or configuration?
6. Is your application containerized?

**Infrastructure as Code**

7. Is your infrastructure defined in code (Terraform, CloudFormation, Pulumi, or equivalent)?
8. Can you rebuild your production environment from scratch using those templates?

**Resilience Patterns**

9. Do you have circuit breakers on your outbound service calls to prevent cascading failures?
10. Do all outbound calls (APIs, databases, message queues) have explicit timeouts configured?
11. Do you implement retries with exponential backoff and jitter for transient failures?
12. Does your application use connection pooling for database connections, with appropriate limits?

**Health Checks and Disaster Recovery**

13. Does your application expose a health check endpoint that validates connectivity to critical dependencies?
14. Do you have a documented RPO (Recovery Point Objective) and RTO (Recovery Time Objective) that the business has agreed to?
15. Do you have a tested disaster recovery plan? When was it last exercised?
16. Does your application deploy across multiple availability zones?

**Availability**

17. What is your current measured uptime? Do you track it?
18. When a dependency goes down, does your application degrade gracefully, or does it fail completely?

---

## Tenet 10: AI-Ready Architecture

**Data Accessibility**

1. Is your application's data accessible through well-defined interfaces (APIs, events, data exports), or is the only way to get data out through direct database access?
2. Do any ML pipelines, reporting tools, or analytical workloads run queries directly against your production database?
3. Do you have a CDC (change data capture) pipeline or any streaming mechanism that exports data to an analytical store?

**Domain Events for ML**

4. Does your application emit domain events to a message broker for significant business actions?
5. Do those events carry enough context that a downstream consumer can use them without calling back to your application?
6. Do your event schemas follow a shared standard, and are they registered in a schema registry?

**ML Integration**

7. Does your application currently integrate with any ML models in production (fraud scoring, document classification, credit decisioning, etc.)?
8. If yes, is that integration behind an abstraction layer so you can swap model versions or fall back to rules-based logic without a code change?
9. If an ML model your application depends on goes down, what happens? Is there a defined fallback behavior, or would it produce an unhandled error?

**Feature Store and Data Products**

10. Are there any computed features (like "average transaction amount over 30 days") that your application calculates? Are they published to a shared feature store, or does every team compute them independently?

**Data Governance for AI**

11. Are sensitive data fields in your schemas classified and tagged?
12. If data is exported for ML consumption, does it pass through a pipeline that automatically masks PII and enforces data governance rules?

**Feedback Loops**

13. For any ML model your application uses, do you capture the actual outcomes so the model can receive feedback for retraining?

---

## Tenet 11: Security, Compliance, and Governance

**Authentication and Authorization**

1. Does your application authenticate users through the firm's centralized identity provider, or does it maintain its own user store?
2. Do you enforce role-based access control? Are the roles aligned to business functions and the principle of least privilege?
3. When was the last time you reviewed who has access to your production systems and removed stale permissions?
4. For service-to-service communication, do services authenticate each other, or do they rely on network location for trust?

**Sensitive Data Protection**

5. What sensitive data does your application handle (PII, financial records, account numbers)?
6. Is sensitive data encrypted at rest?
7. Is sensitive data encrypted in transit for all endpoints and database connections?
8. Is there any sensitive data in non-production environments (dev, test) that uses real production data?

**Audit Logging**

9. Does your application produce audit logs for user authentication events, data access, data modifications, and administrative actions?
10. Are your audit logs immutable (cannot be modified or deleted after the fact)?
11. Can you answer right now who accessed a specific piece of sensitive data in the last 30 days?
12. Do your audit log retention periods meet regulatory requirements?

**Secret Management**

13. Are there any credentials, API keys, or connection strings hardcoded in your source code or committed to version control?
14. Do you use a secrets management solution (vault, key management service)?
15. Do you have secret detection integrated into your development workflow to prevent accidental commits?

**Vulnerability Management**

16. Do you scan your third-party dependencies for known vulnerabilities?
17. Is security scanning automated in your CI/CD pipeline? Do critical findings block deployment?
18. When was your last security assessment or penetration test?

**Change Management**

19. Does every change to your production system go through a documented approval process?
20. Is there segregation of duties (the person who writes code cannot also deploy it and modify production data without independent oversight)?

**Third-Party Risk**

21. Are all vendor integrations documented? Do vendor connections use encrypted channels and validate inputs?
22. Is vendor access scoped to the minimum required?

**Incident Response**

23. Do you have a documented incident response procedure for security events?
24. Has the team been trained on it? Has it been tested?

---

## How to Score

For each tenet, use the answers to determine the maturity level:

| Score | Meaning | General Indicators |
|-------|---------|--------------------|
| **0** | Not Started | The team has not begun working on this area. No awareness, no documentation, no adoption. |
| **1** | Foundational | The team understands the pattern and has taken initial steps. Key things are documented. Some manual processes remain. Technical debt is identified. |
| **2** | Adopted | The pattern is actively practiced in daily work. Key workflows are automated. New work consistently follows the pattern. Legacy code is being migrated incrementally. Metrics are collected. |
| **3** | Optimized | The pattern is fully embedded and continuously improving. The team mentors others and contributes back to the organization. The application is a reference implementation. |

Record the score (0 to 3) for each of the 11 tenets, then calculate the weighted composite score using the weights from the Architecture Tenets Overview.
