# Observability-Driven Systems

## Purpose

Monitoring tells you whether something is up or down. Observability tells you why it is down and what is affected. If you cannot ask new questions of your production systems without deploying new code, you do not have observability, you have dashboards. Structured logs, metrics, and distributed traces should be first-class concerns from day one, not things you bolt on after an incident. Observability is also a regulatory expectation, as auditors want to know how you detect issues, how quickly you respond, and whether you can trace a request from end to end.

---

## Key Principles

- Every service, module, and integration point ships with structured logging, health checks, and basic metrics from day one
- All logs are structured and machine-readable (JSON or equivalent), not free text
- Every business transaction that crosses a system boundary carries a correlation ID
- Metrics focus on what the business cares about (payment success rates, completion times), not just infrastructure
- Alerts are based on service level objectives, not arbitrary thresholds
- Developers can create dashboards, query logs, and trace requests without filing a ticket
- No PII or sensitive data in logs without masking
- Observability data has defined retention policies and access controls

---

## How This Applies by Architecture Model

### Modular Monolith

- **Structured logging with module context.** Every log entry should include the module name, a correlation ID, and enough context to identify which business operation it belongs to. Even inside a single process, you need to know which module generated what.
- **Health check endpoints.** Expose a health check that reports the status of each internal module and its dependencies, like database connections, message queues, and downstream APIs.
- **Internal request tracing.** Use in-process tracing to capture how a request flows through modules. This gives you the same kind of visibility that distributed tracing gives microservices, but without the network overhead.
- **Centralized metrics collection.** Publish module-level metrics (response times, error rates, queue depths) to a central collector. Even in a monolith, different modules have different performance characteristics and you need to see them independently.

### Macrocomponents

- **Distributed tracing across services.** With multiple deployable units, you need trace propagation across HTTP calls, message queues, and event streams. Every outbound call should propagate trace context headers.
- **Per-service dashboards and SLOs.** Each macrocomponent should have its own dashboard showing request rate, error rate, and latency. Define SLOs for each service and track them independently.
- **Centralized log aggregation.** Logs from all services should flow into a single platform where you can search and correlate across service boundaries. Tag every log entry with a service name and trace ID.
- **Dependency health visibility.** Each macrocomponent should report the health of its dependencies. If the payment service cannot reach the fraud engine, that should be visible in seconds, not discovered during an incident call.

### Microservices

- **Mandatory distributed tracing.** In a microservices architecture, you cannot operate without distributed tracing. Every service must propagate trace context. Every span should include the operation name, status, and relevant business identifiers.
- **Service mesh observability.** If you are running a service mesh, use it to collect golden signal metrics (request rate, error rate, latency) automatically. This gives you baseline observability without changing application code.
- **Automated anomaly detection.** With many services, you cannot watch every dashboard. Use anomaly detection to surface unexpected changes in error rates, latency distributions, or traffic patterns.
- **Correlation across async boundaries.** Many microservice interactions are asynchronous. Make sure trace context is propagated through message brokers and event streams, not just synchronous HTTP calls.
- **Canary and progressive delivery observability.** When deploying a new version, compare its metrics against the existing version in real time. Automated rollback should trigger when SLO violations are detected during a rollout.

---

## The Three Pillars in Practice

**Logs** are the narrative record of what your system did. Every significant business event should produce a structured log entry. That means workflow initiations, approval decisions, state transitions, authentication attempts, and authorization failures. Each log entry should include a timestamp, severity level, service or module name, correlation ID, and a structured payload with relevant business identifiers. Avoid logging sensitive data or PII in plaintext. Mask or tokenize those fields. Your log platform should support fast, indexed search so that when an incident happens, you can pull up every log entry for a specific request in seconds.

**Metrics** are the numerical measurements that tell you how your system is behaving right now and over time. Focus on the four golden signals for every service. Request rate tells you how much traffic you are handling. Error rate tells you how much of that traffic is failing. Latency tells you how fast you are responding. Saturation tells you how close you are to capacity. Add business-level metrics too, like processing volume per minute, average completion time, and failed authentication rate by channel. These metrics feed your dashboards, your SLOs, and your capacity planning. Use histograms for latency instead of averages, because averages hide the tail that your worst-affected consumers experience.

**Traces** connect the dots across services and modules. A single action might touch authentication, validation, multiple processing steps, and downstream notifications. A distributed trace captures the entire journey as a tree of spans, showing you exactly where time was spent, where errors occurred, and which services were involved. Regulators ask about processing paths. Incident responders need to pinpoint failures fast. Product teams want to know where the bottlenecks are. Make sure every trace carries business context, like the request type and a masked reference ID, so you can filter traces by what matters.

When these three pillars work together, you get something powerful. You see an alert fire because your success rate SLO is burning too fast (metrics). You drill into the affected time window and find a spike in timeout errors from a downstream service (logs). You pull up a sample trace and see that the downstream call is taking 12 seconds instead of the usual 200 milliseconds because a dependency is degraded (traces). That entire investigation takes minutes, not hours. That is observability.

---

## SLOs, SLIs, and Alerting

A Service Level Objective (SLO) is a target for how well your service should perform, expressed as a percentage over a time window. For example, "99.9% of API requests will complete successfully within 2 seconds, measured over a rolling 30-day window." The measurement itself is the Service Level Indicator (SLI). The SLO is the target you set for that measurement. Start with SLOs for your most critical flows. Do not try to define SLOs for everything at once. Pick three to five that matter most and get those right first.

The real value of SLOs comes from how you alert on them. Traditional alerting uses static thresholds. "Alert when error rate exceeds 5%" or "alert when latency exceeds 3 seconds." The problem is that these thresholds are usually guesses, and they generate noise. A brief spike to 6% error rate that resolves in 30 seconds is not the same as a sustained 5.1% error rate that slowly eats your error budget over days. SLO-based alerting uses the concept of burn rate. If your error budget for the month is being consumed faster than expected, you get alerted. A fast burn (you will exhaust your budget in hours) triggers an urgent page. A slow burn (you will exhaust your budget in days) triggers a ticket for investigation. This approach dramatically reduces alert fatigue and focuses your team on the incidents that actually affect customers.

Your error budget is the inverse of your SLO. A 99.9% SLO gives you a 0.1% error budget, which works out to about 43 minutes of downtime per month. When the budget is healthy, teams have room to take risks, ship faster, and experiment. When the budget is depleted, the team shifts focus to reliability. This creates a natural, data-driven conversation between feature delivery and operational stability. It replaces the usual argument of "we need to ship features" versus "we need to fix reliability" with a shared number that everyone can see.

---

## Adoption Guidance

### Level 1. Foundational

- Structured logging is implemented in all new code, using a consistent format (JSON preferred) with correlation IDs, timestamps, and service/module identifiers.
- A centralized log aggregation platform is in place and all application logs flow into it. Teams can search and filter logs without SSH-ing into servers.
- Basic health check endpoints exist for every deployable component, reporting at minimum whether the service is running and can reach its primary datastore.
- At least one dashboard exists per application showing the golden signals (request rate, error rate, latency, saturation) for its primary entry points.
- Application-level metrics are being collected and are accessible to the development team, even if dashboards are basic.

### Level 2. Adopted

- Distributed tracing is implemented across all synchronous service calls, with trace context propagated through headers. Traces are searchable in a central platform.
- SLOs are defined for the top three to five critical user journeys, with SLIs being measured and tracked on dashboards visible to the team.
- Alerting is based on SLO burn rates rather than arbitrary static thresholds, at least for the primary SLOs.
- Runbooks are documented for every alert, describing what the alert means, how to investigate, and what actions to take.
- Log and trace data includes business context, like transaction type and masked identifiers, so that you can filter by business operations, not just technical endpoints.
- Trace context is propagated through asynchronous messaging for at least the primary event-driven flows.

### Level 3. Optimized

- Observability covers 100% of production traffic paths, including async flows, batch jobs, and scheduled tasks. There are no blind spots.
- Automated anomaly detection identifies unusual patterns in metrics and triggers investigation before SLOs are breached.
- Error budgets are actively used in planning. When budgets are healthy, the team ships features. When budgets are thin, the team prioritizes reliability work.
- Observability data feeds into capacity planning, performance testing, and architecture decisions. It is not just for incident response.
- The team contributes shared observability libraries, dashboards, or alerting templates that other teams can reuse.
- Post-incident reviews consistently reference observability data, and improvements to instrumentation are a standard outcome of every review.

---

## Minimum Standards

1. All applications must produce structured logs in a consistent, machine-readable format with correlation IDs that can trace a request across all components involved.

2. All applications must send logs to the organization's centralized log aggregation platform. Logs must not exist only on local servers or ephemeral containers.

3. Every deployable component must expose a health check endpoint that reports its status and the reachability of its critical dependencies.

4. Every application must collect and publish the four golden signal metrics (request rate, error rate, latency, saturation) for its primary entry points.

5. Applications must define at least one SLO for availability and one for latency, with SLIs measured and visible on a dashboard.

6. All inter-service calls must propagate trace context using a standard format (W3C Trace Context or B3 propagation headers).

7. Sensitive data (PII, full account numbers, authentication credentials) must never appear in logs, metrics labels, or trace attributes in plaintext. Use masking or tokenization.

8. Every production alert must have a corresponding runbook that describes how to investigate and respond.

9. Log retention must meet the organization's regulatory and compliance requirements, which is typically a minimum of seven years.

10. Observability tooling must be accessible to all team members without requiring special access requests. Developers should be able to query logs, view traces, and inspect dashboards for their own services.

---

## Scoring Criteria

| Area | Level 1 | Level 2 | Level 3 |
|------|---------|---------|---------|
| **Logging** | Structured logs with correlation IDs flow to a central platform | Logs include business context and are searchable by transaction type, account, and flow | Logs feed automated analysis, anomaly detection, and compliance reporting |
| **Metrics** | Golden signals collected and visible on a basic dashboard | SLOs defined for critical journeys with SLIs tracked over time | Error budgets drive planning, automated anomaly detection is active |
| **Tracing** | Basic request tracing within a single deployable unit | Distributed traces span all synchronous and primary async calls across services | Full end-to-end tracing covers every production path including batch and event-driven flows |
| **Alerting** | Alerts exist for critical failures (service down, database unreachable) | Alerts are SLO-based with burn rate thresholds and linked runbooks | Alerts auto-correlate with traces and logs, reducing mean time to diagnosis to under 15 minutes |
| **Operational Maturity** | Team can investigate a production issue using centralized logs | Team resolves most incidents using observability tooling without SSH or ad-hoc queries | Post-incident reviews consistently improve instrumentation and the team shares patterns org-wide |

---

## Anti-Patterns

- **"Grep and pray" debugging.** Teams SSH into production servers and search through raw log files to diagnose issues. This does not scale, is not auditable, and it creates unnecessary access to production systems.

- **Dashboard graveyards.** The team built 30 dashboards during a previous initiative, but nobody looks at them. Dashboards that are not tied to SLOs or incident workflows become stale and misleading. Build fewer dashboards that actually matter.

- **Alerting on everything.** Every metric has an alert with a static threshold. The on-call engineer gets 200 alerts per week, ignores most of them, and misses the one that actually matters. When a real outage happens, the signal is lost in the noise.

- **Missing correlation IDs.** A failed request is reported. The support team can see it failed in the front-end logs, but there is no correlation ID linking it to the backend services involved. The investigation takes three teams and two hours instead of five minutes.

- **Logging sensitive data.** In a rush to add more visibility, a team logs full account numbers, social security numbers, or authentication tokens in plaintext. This creates a data breach risk and a regulatory violation that is entirely self-inflicted.

- **Observability as someone else's job.** The development team writes the code and throws it over the wall to an operations team that is expected to "make it observable." This never works. The people who write the code are the people who know what to instrument. Observability is a development responsibility.

- **Vanity metrics instead of business metrics.** The dashboard shows CPU utilization, JVM heap size, and thread counts, but nobody can tell you the current success rate or the p99 latency for key operations. Technical metrics matter, but they should support business metrics, not replace them.

- **Ignoring async and batch flows.** The team has great observability for their REST APIs, but the nightly batch settlement job, the event-driven fraud check, and the file-based regulatory report have zero instrumentation. These are often the most critical and the hardest to debug when they fail.

---

## Getting Started

1. **Add structured logging to your next release.** Pick a structured logging library and standardize on JSON format. Add a correlation ID to every log entry. If your application already has logging, convert it from free-text to structured format one module at a time.

2. **Set up centralized log aggregation.** Get your logs flowing into the organization's log platform. Make sure every developer on the team can access the platform and run basic queries. Run a team session where you walk through how to search and filter logs for a recent production issue.

3. **Define your first SLO.** Pick your most important customer-facing endpoint. Define what "good" looks like (for example, "a successful response in under 1 second"). Set up an SLI to measure it and a dashboard to track it. You can add more SLOs later, but start with one and learn the process.

4. **Add health checks and golden signal metrics.** Expose a health check endpoint for every deployable component. Instrument your primary entry points to emit request rate, error rate, and latency metrics. Connect them to a dashboard so the team can see the state of the system at a glance.

5. **Trace one critical business flow end to end.** Pick a high-value flow in your application. Add trace context propagation across every system it touches. Walk through the trace in your observability platform and verify you can follow the entire journey. This exercise will reveal every gap in your instrumentation.

---

*This tenet is part of the Architecture Modernization initiative. For the full set of tenets and the scoring framework, see the [Architecture Tenets Overview](./00-Architecture-Tenets-Overview.md).*
