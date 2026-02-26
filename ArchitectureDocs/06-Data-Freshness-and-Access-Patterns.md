# Data Freshness and Access Patterns

## Purpose

This tenet is about knowing how fresh your data is, knowing how fresh it needs to be, and closing the gap. Across the firm, applications routinely make decisions based on data that is 24 hours old or more because most systems were built around batch processing. It is not about making everything real-time. Some data can absolutely be a day old and that is fine. But the team should be making that decision deliberately, not inheriting it because "that is how the batch job works."

## Key Principles

- Every data source and data feed has a documented freshness requirement agreed on with the business
- If the business needs data within minutes, a nightly batch process is not acceptable
- Applications know and expose how fresh their data is at any point in time
- Read paths are separated from write paths where performance or freshness requires it
- Data is pushed to consumers on change, not pulled on a schedule, for time-sensitive use cases
- Stale data that is acceptable for one use case may not be acceptable for another. Each use case is evaluated independently
- Read models store data in the shape consumers need, not the shape it was written in
- Data freshness is monitored and alerted on just like uptime and latency

## How This Applies by Architecture Model

### Modular Monolith

- Identify every place your application consumes data from another system. Document how that data gets there and how old it is when you use it.
- Replace at least one batch-fed data source with a near-real-time alternative. This could be an event subscription, a change data capture (CDC) stream, or an API call with caching.
- Separate read and write data access in your code. Use different classes or modules for queries versus commands, even if they hit the same database.
- Use database views or denormalized read tables for high-traffic read paths instead of complex joins against transactional tables.
- Add "as of" timestamps to your read models so consumers can see how current the data is.

### Macrocomponents

- Each macrocomponent owns its own read models and is responsible for their freshness.
- Use events or CDC streams to keep read models in sync across service boundaries. Do not rely on batch exports between services.
- For cross-domain dashboards, build a dedicated read model that subscribes to events from multiple services rather than querying each service at read time.
- Cache at the API gateway level for reads that can tolerate a few seconds of delay. Define explicit TTLs based on freshness requirements, not arbitrary values.
- Monitor projection lag for every event-driven read model. Alert when freshness falls below the agreed threshold.

### Microservices

- Every microservice owns its read projections. No service queries another service's database.
- Event-driven projections are the primary mechanism for keeping read models current. Subscribing to events replaces batch feeds.
- Deploy dedicated read databases (Elasticsearch, read replicas, time-series stores) for high-traffic or specialized query patterns.
- Implement the Backend for Frontend (BFF) pattern when different channels need different shapes of the same data.
- Version your read model schemas independently from your write models. Read models evolve faster and should not be coupled to write-side schema changes.

## Replacing Batch with Near-Real-Time

The biggest source of stale data in most enterprise applications is batch processing. Data moves between systems on a nightly schedule because that is how it was built 10 or 20 years ago. The batch job was never meant to be the long-term solution, but nobody replaced it.

The path from batch to near-real-time does not have to be a big bang migration. Start by mapping your batch data flows. For each one, ask three questions. How old is this data when it arrives? How old does the business need it to be? And what is the cost of the gap? Some batch jobs will be fine as they are. A monthly regulatory report that runs on the 5th of the month does not need real-time data. But a fraud alert that fires based on yesterday's transactions is a problem worth solving.

For the flows that need to be fresher, the most common approaches are event-driven updates (the source system publishes events as changes happen), change data capture (a CDC tool like Debezium watches the source database and streams changes), and API-based polling with caching (the consumer calls the source API on a schedule more frequent than nightly). Each has tradeoffs in complexity, latency, and infrastructure cost. Start with the approach that fits your current tooling and maturity. You can always move to a more sophisticated pattern later.

The goal is not to eliminate all batch processing. The goal is to make sure batch is a deliberate choice, not the default because nobody built anything better.

## Read Optimization and CQRS

When you need fresh data served fast, separating your read path from your write path pays off quickly. This is the core idea behind CQRS (Command Query Responsibility Segregation). The write side handles validation, business rules, and safe storage. The read side serves pre-computed, denormalized data optimized for the specific query pattern.

You do not need to go all-in on CQRS or event sourcing to get value here. The simplest version is having different code modules for reads and writes, hitting the same database but using different tables. A denormalized "account summary" table that gets updated when balances change is dramatically faster to query than joining five normalized tables every time someone opens the mobile app.

CQRS shows up naturally in most enterprise applications. Your write pipeline needs strong consistency and careful orchestration. But your read paths just need fast, pre-computed results. Your reporting team needs to query patterns across millions of records, but the write side stores individual records one at a time. These are fundamentally different workloads and they deserve different solutions.

## Adoption Guidance

### Level 1. Foundational

- Map all data flows into your application. Document where each data source comes from, how it gets there (batch, API, event, manual), and how stale it is when you use it.
- For each data source, document the freshness requirement the business actually needs. Get sign-off from a product owner or business stakeholder.
- Identify the top 3 data sources where the gap between "how fresh it is" and "how fresh it needs to be" is the largest. These are your priorities.
- Separate read and write data access in your codebase, even if they hit the same database.
- Add "as of" or "last updated" timestamps to at least one key read path so consumers can see data freshness.
- Measure your current read latency baselines (p50, p95, p99) for key user-facing queries.

### Level 2. Adopted

- At least one batch-fed data source has been replaced with a near-real-time alternative (events, CDC, or frequent API polling).
- All major read paths use dedicated read models, caches, or materialized views. No customer-facing read path hits the transactional database with complex joins.
- Data freshness is monitored and alerted on. You know when a read model falls behind and you have runbooks for catching it up.
- Each read model has a documented consistency model and consumers know what freshness to expect.
- Read and write data stores are physically separated for your highest-traffic domains.

### Level 3. Optimized

- All data freshness requirements are met. No business-critical data source is staler than the agreed threshold.
- Every read path is served by a purpose-built read model optimized for its specific query pattern.
- Projection lag is measured and consistently under defined SLOs (for example, under 2 seconds for customer-facing views, under 500 milliseconds for fraud detection).
- Read models are fully rebuildable from source events or change logs and have been tested end to end.
- The team publishes reusable patterns and libraries for data freshness and read optimization that other teams can adopt.
- Batch processes that remain are documented as intentional choices with business justification.

## Minimum Standards

1. Every data source consumed by the application must have a documented freshness requirement that the business has agreed to.
2. The application must be able to answer "how old is this data right now?" for every key read path.
3. Read and write data access must be separated in code. Query logic and command logic must not live in the same class or function.
4. At least one high-traffic read path must be served by a dedicated read model, materialized view, or cache rather than a raw query against the transactional database.
5. No high-traffic read operation should require joins across more than 3 tables. If it does, you need a denormalized read model.
6. Caching strategies must include explicit TTLs and invalidation rules. No unbounded caches that silently serve stale data.
7. Read path latency must be monitored with alerting on degradation. Define p95 latency targets for every customer-facing read path.
8. Any data source that is staler than its documented freshness requirement must have a remediation plan in the backlog.
9. Read models must be rebuildable. If you lose a read projection, there must be a documented process to recreate it from the source of truth.
10. Teams must review data freshness and read path performance quarterly.

## Scoring Criteria

| Area | Level 1 | Level 2 | Level 3 |
|------|---------|---------|---------|
| Data Flow Mapping | All incoming data sources are documented with current freshness and delivery method. | Freshness gaps are identified and prioritized. Remediation plans exist for the top gaps. | All data flows meet documented freshness requirements. Remaining batch flows have business justification. |
| Freshness Visibility | At least one read path exposes "as of" or "last updated" timestamps. | All major read paths expose freshness metadata. Consumers know the consistency model. | Freshness is visible to all consumers. Staleness is monitored and alerted on with defined SLOs. |
| Read/Write Separation | Read and write logic are in separate classes or modules. At least one read model exists. | All major read paths use dedicated read models. No complex joins in high-traffic reads. | Every read path is purpose-built and independently evolvable. Read models are versioned. |
| Batch Replacement | Batch data flows are inventoried and freshness gaps documented. | At least one critical batch flow has been replaced with near-real-time delivery. | All time-sensitive data flows use near-real-time patterns. Batch is used only where appropriate. |
| Monitoring and Alerting | Read latency baselines are established. Basic monitoring is in place. | Read latency, cache hit rates, and projection lag are monitored with alerts on degradation. | Real-time dashboards cover all read paths. Anomaly detection identifies issues before users notice. |
| Rebuildability | Read models have a known source of truth. Manual rebuild is possible. | Read models can be rebuilt through a documented, tested process. | Rebuilds are automated, tested regularly, and complete within documented recovery targets. |

## Anti-Patterns

- **"It runs every night, that is good enough."** Accepting nightly batch as the permanent solution without ever checking if the business actually needs fresher data. Many batch jobs were built as temporary solutions that became permanent through inertia. Challenge every one of them.

- **The invisible staleness.** Serving data that is 24 hours old without telling anyone. A compliance officer makes a decision based on a dashboard showing yesterday's data and does not realize it. Always make freshness visible.

- **The God Query.** A single SQL query that joins 15 tables, filters by 8 parameters, and powers three different screens. Every time someone changes the schema, this query breaks. Build separate, simple read models for each use case.

- **Treating the transactional database as a reporting engine.** Running complex analytical queries against the same database that processes real-time payments. This causes lock contention during peak hours and slows down everything.

- **Cache and pray.** Adding a cache layer without thinking about invalidation. Data changes but the UI still shows the old value for 15 minutes because nobody set a TTL or wired up invalidation.

- **Batch chain dependency.** System A feeds System B overnight, System B feeds System C the next night, System C feeds System D the night after that. By the time System D has the data, it is three days old. Map and shorten these chains.

- **One read model to rule them all.** Building a single massive denormalized table that tries to serve the mobile app, the internal dashboard, the compliance team, and the fraud detection system. Each consumer has different query patterns and freshness needs. Build focused read models for each.

- **Premature event sourcing.** Jumping to a full event-sourced architecture when all you needed was a materialized view, a cache, and a CDC stream. Event sourcing adds significant complexity. Start simple and add it only when you genuinely need temporal queries or a complete audit trail.

## Getting Started

1. **Map your data flows.** List every data source your application depends on. For each one, write down how it gets to you (batch, API, event, manual) and how old it typically is when you use it. This alone will be eye-opening.

2. **Talk to the business.** For your top data sources, ask the business stakeholders how fresh the data actually needs to be. You may find that some batch jobs are fine and others are causing real pain. Get the freshness requirements documented and agreed on.

3. **Pick your biggest gap.** Find the data source with the largest gap between "how fresh it is" and "how fresh it needs to be." This is your first candidate for improvement. Replace the batch feed with events, CDC, or more frequent API polling.

4. **Add freshness metadata.** For your most important read paths, add a "last updated" timestamp. Surface it in the UI or API response. This builds awareness and prevents people from assuming the data is current when it is not.

5. **Separate read and write code.** Refactor your data access layer so read operations and write operations are in different modules. You do not need to change your database yet. Just clean up the code so you can evolve each path independently.

*Related tenets: [Domain-Driven Architecture](./01-Domain-Driven-Architecture.md), [Event-Driven Data Flow](./03-Event-Driven-Data-Flow.md), [Observability-Driven Systems](./07-Observability-Driven-Systems.md)*
