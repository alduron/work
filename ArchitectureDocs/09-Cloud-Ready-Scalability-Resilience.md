# Cloud-Ready Scalability and Resilience

## Purpose

Cloud readiness means your applications can scale out when demand increases and scale back when it drops, handle failures gracefully without human intervention, and run on infrastructure defined in code. Across the firm, predictable spikes like month-end close, quarter-end reporting, and batch processing cycles regularly push applications past their designed capacity. Downtime is not just an inconvenience, it means regulatory scrutiny and real operational impact. This tenet gives you a practical path to solve both scalability and resilience, regardless of your architecture model.

---

## Key Principles

- Scale horizontally by adding instances, not by getting bigger servers
- Any single instance can be killed or replaced at any time without causing an outage
- No session state, user state, or temporary files stored on the local server
- All infrastructure is defined in code and can be rebuilt from scratch
- The application degrades gracefully when dependencies are unavailable
- RPO and RTO are defined and documented for every critical application
- Scaling behavior is observable and measurable
- No hardcoded hostnames, IPs, or environment-specific paths in application code
- Every critical path has a timeout, a retry policy, and a fallback

---

## How This Applies by Architecture Model

### Modular Monolith

- **Run multiple stateless instances behind a load balancer.** Even a monolith can scale horizontally if it is stateless. Move session state to an external cache and you can run as many copies as you need.
- **Externalize all configuration.** Connection strings, feature flags, and environment-specific values should come from environment variables or a configuration service. Never hardcode server names or file paths.
- **Use health checks and readiness probes.** Your load balancer needs to know which instances are healthy. Implement a health endpoint that checks database connectivity and other critical dependencies.
- **Plan for database scaling separately.** The monolith scales horizontally, but your database probably does not. Use read replicas for reporting queries, implement connection pooling, and design your data access patterns to avoid bottlenecks.
- **Containerize your monolith.** Packaging your application as a container image makes it portable across environments and gives you consistent deployments from dev through production.

### Macrocomponents

- **Scale each macrocomponent independently.** One service might need 10 instances during peak hours while another only needs 2. Size each service based on its own demand patterns.
- **Use asynchronous communication for non-critical paths.** Not every interaction needs to be a synchronous API call. Put a message queue between services for workflows that can tolerate a few seconds of delay, like notifications or audit logging.
- **Deploy across multiple availability zones.** Each macrocomponent should run in at least two availability zones so that a single zone failure does not take down the service.
- **Implement circuit breakers between services.** When one macrocomponent is struggling, other services should back off rather than hammering it with requests and making the problem worse.
- **Use auto-scaling based on real metrics.** Set up auto-scaling rules tied to CPU, memory, queue depth, or request latency. Do not just guess at instance counts and leave them static.

### Microservices

- **Embrace elastic scaling with container orchestration.** Use Kubernetes or a managed container service to automatically scale individual services based on demand. A service might scale to 50 instances during peak processing and back to 5 overnight.
- **Design every service for independent failure.** If one service goes down, other services should still be able to operate with appropriate fallback behavior. No single service failure should cascade into a system-wide outage.
- **Use service mesh for resilience policies.** A service mesh like Istio or Linkerd gives you retries, timeouts, circuit breakers, and mutual TLS without changing your application code.
- **Implement distributed caching strategically.** Cache reference data (currency codes, branch lists, product catalogs) close to the services that need it. This reduces load on shared databases and improves response times.
- **Automate canary and blue-green deployments.** With many services deploying independently, you need deployment strategies that let you roll back quickly if a new version causes problems.

---

## Infrastructure as Code

Your infrastructure should live in a version-controlled repository right next to your application code. Every load balancer, every database, every network rule, every IAM policy should be defined in Terraform, CloudFormation, Pulumi, or whatever tooling your organization has standardized on. If someone needs to click through a console to create infrastructure, that is a gap you need to close.

The benefits are significant. When auditors ask how your production environment is configured, you point them at the code. When you need a disaster recovery environment in another region, you run the same templates. When a developer needs a test environment that matches production, they provision it themselves in minutes instead of submitting a request that takes three weeks. Infrastructure as code also eliminates the "it works on my machine" problem that comes from environments that have drifted apart over time.

Start with the most critical pieces first. Define your compute resources (VMs, containers, serverless functions), your networking (VPCs, subnets, security groups), and your data stores. Then expand to cover monitoring, alerting, and access controls. Every change should go through a pull request, get reviewed, and be applied through a pipeline. Treat infrastructure changes with the same rigor you treat application code changes.

---

## Resilience Patterns

**Circuit breakers** are your first line of defense against cascading failures. When your application calls an external service and that service starts failing or responding slowly, the circuit breaker opens and stops sending requests. Instead of every request timing out and consuming threads, your application fails fast and can return a degraded response or fall back to cached data. Without a circuit breaker, every request backs up waiting for a timeout. With one, you can immediately return a "try again later" response or route to an alternative path.

**Retries with exponential backoff** handle transient failures. Network blips, brief database hiccups, and temporary service unavailability all resolve themselves within seconds. A simple retry with increasing wait times (1 second, 2 seconds, 4 seconds) can recover from these without any human intervention. But retries without backoff are dangerous. If a downstream service is struggling under load and every caller immediately retries, you have just doubled the load and made the problem worse. Always add jitter (a small random delay) to prevent all your instances from retrying at the exact same moment.

**Bulkheads** isolate failures to prevent them from spreading. The concept comes from ship design, where watertight compartments prevent a single breach from sinking the whole vessel. In your application, this means isolating thread pools, connection pools, or even entire service instances by function. For example, a service might use separate connection pools for different workload types. If one path slows down, the other keeps flowing normally. Without bulkheads, one slow dependency can consume all your resources and bring everything to a halt.

**Timeouts** are deceptively simple but critically important. Every outbound call from your application should have an explicit timeout. Every database query, every API call, every message publish. The default timeout in most frameworks is either infinite or far too generous (30 seconds, 60 seconds). In a high-throughput system, a 30-second timeout on a dependency call means each stuck request holds a thread for 30 seconds. At 100 requests per second, you run out of threads in minutes. Set aggressive timeouts based on your actual performance data (the 99th percentile response time plus a small buffer) and combine them with circuit breakers for a robust defense.

---

## Adoption Guidance

### Level 1. Foundational

- **Externalize configuration from your application code.** Move connection strings, hostnames, and environment-specific settings into environment variables or a configuration file that is injected at deployment time.
- **Implement basic health check endpoints.** Create a `/health` or `/ready` endpoint that verifies your application can connect to its critical dependencies (database, message broker, key external services).
- **Eliminate hardcoded server dependencies.** Your application should not reference specific server names, IP addresses, or file system paths that tie it to a particular machine.
- **Document your RPO and RTO for each environment.** Work with your business stakeholders to define what recovery looks like. Write it down even if you cannot meet the targets yet.
- **Run at least two instances of your application in production.** Remove the single point of failure at the application tier. Put a load balancer in front and verify that traffic distributes correctly.
- **Create a basic runbook for common failure scenarios.** Document what to do when the database is unreachable, when a downstream service is down, and when the application runs out of memory.

### Level 2. Adopted

- **Define your infrastructure in code for all environments.** Use Terraform, CloudFormation, or an equivalent tool. Store the templates in version control and apply them through a pipeline.
- **Implement auto-scaling based on measured metrics.** Your application should scale up and down automatically based on CPU, memory, request rate, or queue depth. No one should be manually adding instances during peak periods.
- **Deploy across multiple availability zones.** Your application should survive the loss of a single availability zone without downtime.
- **Implement circuit breakers on all external service calls.** Use a library like Resilience4j, Polly, or Hystrix (or your service mesh) to protect against cascading failures from slow or failing dependencies.
- **Run regular failover tests.** Simulate the loss of an instance, a database failover, or a dependency outage at least quarterly. Verify that your application recovers within your documented RTO.
- **Containerize your application with a CI/CD pipeline that builds and deploys images.** Containers give you portable, repeatable deployments and are the foundation for more advanced scaling strategies.

### Level 3. Optimized

- **Implement chaos engineering practices.** Run controlled experiments in production (or production-like environments) to find weaknesses before they cause real outages. Start with simple experiments like killing random instances and work up to more sophisticated scenarios.
- **Achieve multi-region deployment for critical services.** Your most important applications should be deployable across regions with automated failover.
- **Use predictive auto-scaling for known demand patterns.** If you know month-end processing spikes 3x every month, pre-scale your infrastructure ahead of the spike rather than reacting to it.
- **Implement zero-downtime deployments with automated rollback.** Canary deployments or blue-green strategies that automatically roll back if error rates increase or latency degrades.
- **Contribute shared infrastructure modules to the organization.** Package your Terraform modules, Helm charts, or deployment templates so other teams can reuse proven patterns.
- **Achieve and maintain 99.95% or higher availability for critical services.** Track this with real SLO dashboards and conduct blameless post-incident reviews when you miss your targets.

---

## Minimum Standards

1. Applications must not hardcode server names, IP addresses, or environment-specific file paths. All configuration must be externalized.
2. Applications must expose a health check endpoint that validates connectivity to critical dependencies.
3. Production applications must run a minimum of two instances behind a load balancer. No single instance may be a single point of failure.
4. All outbound service calls must have explicit timeouts configured. The default framework timeout is not acceptable for production services.
5. Every application must have a documented RPO and RTO that has been agreed upon with the business.
6. Infrastructure for all non-development environments must be defined in code and applied through an automated pipeline.
7. Applications must be able to restart cleanly without manual intervention. No startup process should depend on manual steps or specific server state.
8. Database connections must use connection pooling with appropriate limits. Unbounded connection creation is not permitted for production applications.
9. Critical applications (Tier 1 and Tier 2) must deploy across at least two availability zones.
10. All production applications must have a tested disaster recovery plan that has been exercised within the last 12 months.

---

## Scoring Criteria

| Area | Level 1 | Level 2 | Level 3 |
|------|---------|---------|---------|
| **Scaling** | Application runs multiple stateless instances behind a load balancer | Auto-scaling is implemented based on real metrics with defined thresholds | Predictive scaling handles known demand patterns. Scaling events are fully automated with no manual intervention |
| **Infrastructure** | Configuration is externalized. Basic environments can be provisioned manually with documented steps | All environments are defined in code and provisioned through pipelines | Infrastructure modules are shared across teams. Changes go through PR review and automated testing |
| **Resilience** | Health checks are in place. Basic failover works at the load balancer level | Circuit breakers, retries with backoff, and timeouts are implemented on all external calls | Chaos engineering is practiced regularly. The team runs game days and proactively finds weaknesses |
| **Disaster Recovery** | RPO and RTO are documented. A DR plan exists on paper | DR failover is tested at least quarterly. Recovery meets documented targets | Multi-region deployment is active for critical paths. Automated failover completes within minutes |
| **Availability** | Application achieves 99% uptime. Planned maintenance windows are used for deployments | Application achieves 99.9% uptime. Zero-downtime deployments are standard | Application achieves 99.95%+ uptime. SLO dashboards are reviewed weekly and drive engineering priorities |
| **Observability for Scale** | Basic resource metrics (CPU, memory, disk) are collected and visible | Scaling decisions are driven by application-level metrics (request rate, queue depth, latency percentiles) | Anomaly detection triggers proactive scaling. Capacity planning is data-driven with forecasting models |

---

## Anti-Patterns

- **The Snowflake Server.** Your production environment was hand-configured over three years by someone who has since left the organization. Nobody knows exactly what is installed on it, and nobody dares touch it. The fix is infrastructure as code. If you cannot rebuild it from a script, document it and start codifying it piece by piece.

- **The Sticky Session Trap.** Your application stores session state in local memory, so the load balancer must always route the same user to the same server. This means you cannot scale horizontally, and if that server goes down, the user loses their session mid-operation. Move session state to Redis or a database.

- **The Retry Storm.** A downstream service starts responding slowly, and every caller retries immediately without backoff. Instead of reducing load on the struggling service, you have tripled it. Now the downstream service collapses entirely and takes multiple upstream services with it. This is especially dangerous during month-end processing when everything is already under pressure. Always use exponential backoff with jitter.

- **The Manual Scaling Dance.** Every month-end, someone on the ops team logs in and manually adds four more application servers. They follow a 47-step runbook that takes two hours. Sometimes they miss a step and the new servers do not pick up traffic correctly. This should be a single auto-scaling rule that triggers on queue depth or CPU utilization.

- **The Shared Database Bottleneck.** Five different applications connect directly to the same database with no connection limits. During peak processing, they compete for connections and all of them slow down. Critical processing gets the same priority as a batch reporting job. Use connection pooling, separate read replicas for reporting, and consider whether those five applications should have their own data stores.

- **The Untested DR Plan.** Your disaster recovery documentation says you can fail over to a secondary data center in four hours. But you have never actually tested it. When a real outage happens, you discover that the secondary database is six hours behind, three configuration files are missing, and the network rules were never updated. Regulators will ask when you last tested your DR plan. Have a real answer.

- **The "It Will Never Go Down" Assumption.** A critical integration partner provides an API with 99.9% uptime, so the team did not bother implementing a circuit breaker or fallback. When that API has an extended outage during quarter-end reporting, the entire downstream workflow stops. Design for the failure case, not the happy path.

- **The Infinite Timeout.** Your application makes a synchronous call to a legacy mainframe service with no timeout configured. When the mainframe is slow (which happens every month-end), your application threads pile up waiting. Eventually you run out of threads, and the application becomes completely unresponsive to all requests, even those that do not depend on the mainframe. Set explicit timeouts on every outbound call.

---

## Getting Started

1. **Audit your current state.** Pick one critical application and answer these questions. Is it stateless? How many instances run in production? What happens if one instance dies? Is there a load balancer? Are there hardcoded server names in the config? This gives you a clear picture of where you stand today.

2. **Externalize your configuration and add health checks.** These two changes are low-risk, high-value, and you can do them in a single sprint. Move environment-specific values out of your code and into environment variables. Add a `/health` endpoint that checks your database and key dependencies.

3. **Run a second instance.** If your application currently runs on a single server, get a second instance running behind a load balancer. This one change eliminates your biggest single point of failure and forces you to deal with any hidden statefulness in your application.

4. **Start codifying your infrastructure.** Pick one environment (your development or test environment is a good choice) and define it in Terraform or your organization's preferred tool. Do not try to codify everything at once. Start with compute and networking, then expand from there.

5. **Set explicit timeouts on your outbound calls.** Review every place your application calls an external service or database and make sure there is an explicit timeout. This is one of the highest-impact resilience improvements you can make, and it usually takes less than a day to implement.

---

*This is a living document. It will evolve as our cloud adoption matures and as we learn from real-world scaling and resilience challenges across the firm. Share your experiences and lessons learned through the Architecture Community of Practice.*
