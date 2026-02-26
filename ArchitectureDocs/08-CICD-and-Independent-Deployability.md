# CI/CD and Independent Deployability

## Purpose

Independent deployability means your team can ship changes to production on your own schedule, without waiting for other teams and without breaking anything else. This tenet covers everything that makes that possible: automated build and deployment pipelines, consistent environments, quality gates that catch problems before they reach production, and feature flags that separate deploying code from releasing functionality. When you get this right, deployments become boring, and boring deployments are exactly what the firm needs.

## Key Principles

- Each team owns its build, test, and deployment pipeline end to end
- No manual steps in the deployment process
- Deployments do not require coordination with other teams
- Small, frequent deployments over large, infrequent releases
- Every environment is provisioned from the same automation. No snowflake servers
- Every build runs automated tests, static analysis, and security scans before deployment
- Deployment and release are separate concerns. Feature flags control visibility, not deployments
- Every deployment can be rolled back without data loss
- All configuration is externalized. No environment-specific values in code

## How This Applies by Architecture Model

### Modular Monolith

- Even though you have one deployable unit, your pipeline should be fully automated. One click (or one merge) should build, test, and deploy the whole application.
- Use database migration tools that run automatically as part of the deployment. No manual SQL scripts run by a DBA at 2 AM.
- Invest in a solid test suite. Since all modules deploy together, you need high confidence that a change in one module has not broken another.
- Use feature flags to control which new functionality is active. This lets you deploy code that is not yet ready for users without branching strategies that drag on for weeks.
- Have a documented and tested rollback procedure. If the deployment fails, you should be able to revert to the previous version within minutes.

### Macrocomponents

- Each macrocomponent gets its own pipeline. One service deploys independently from another, and neither team waits for the other.
- Use contract tests between macrocomponents to verify that a deployment will not break consumers. If your API contract changes, your pipeline should catch it before production.
- Coordinate database changes carefully. Each macrocomponent should own its own data store, so schema changes do not ripple across services.
- Implement health checks and readiness probes so your deployment tooling knows when a new version is actually ready to receive traffic.
- Design for backward compatibility. When you deploy a new version of a macrocomponent, the old version of its consumers should still work without changes.

### Microservices

- Every microservice has its own independent pipeline with its own test suite, its own deployment cadence, and its own versioned artifacts.
- Use consumer-driven contract testing to verify compatibility across service boundaries before deployment.
- Implement canary deployments or blue-green deployments to gradually shift traffic to new versions. If metrics degrade, roll back automatically.
- Version your APIs explicitly. A deployment of one microservice should never require simultaneous deployment of another.
- Invest heavily in deployment observability. With many services deploying independently, you need to know exactly which deployment caused a problem and roll it back fast.

## CI/CD Pipeline Maturity

A mature CI/CD pipeline is the backbone of independent deployability. At its core, the pipeline takes every code change and moves it through a series of automated stages. Build, test, scan, package, deploy. No manual steps. No handoffs. No waiting for someone to approve a Jenkins job at 5 PM on a Friday.

The build stage compiles code, resolves dependencies, and produces a versioned artifact. That artifact is immutable. The exact same binary that passes your test stage is the one that gets deployed to production. You never rebuild for a different environment. The test stage runs unit tests, integration tests, and whatever other automated checks you have. Static analysis tools catch code quality issues. Security scanning tools flag vulnerabilities. If any gate fails, the pipeline stops and the team is notified immediately.

Environment promotion is how your artifact moves from dev to test to staging to production. Each environment should be as close to production as possible. The promotion between environments should be automated, with approval gates where your change management process requires them. For regulated environments like production, this might mean an automated check that a change ticket exists and is approved. But the deployment itself should still be automated.

The goal is a pipeline where a developer merges a pull request and the change reaches production within hours, not days or weeks. For critical hotfixes (think a payment processing bug that is costing real money), you need a fast path that still runs all the quality gates but skips unnecessary delays. Your pipeline should support both the normal flow and the expedited flow, and both should be fully automated.

## Feature Flags and Safe Releases

One of the most powerful patterns for safe deployments is separating the concept of "deploying code" from "releasing a feature." With feature flags, you can deploy new code to production with the feature turned off, verify everything is stable, and then gradually enable it for a small percentage of users before rolling it out to everyone.

Consider a new processing algorithm. You deploy the code, but the flag keeps users on the existing logic. Your team enables the flag for internal users first, validates the results, then gradually rolls it out more broadly. If the new algorithm produces incorrect results, you flip the flag off instantly. No rollback needed. No emergency deployment. The old behavior is still right there in the same deployed code.

Beyond feature flags, techniques like blue-green deployments and canary releases add another layer of safety. In a blue-green deployment, you run two identical production environments. The new version goes to the idle environment, you verify it, and then you switch traffic over. In a canary release, you route a small percentage of traffic to the new version and monitor key metrics like error rates, latency, and transaction success rates. If anything looks wrong, traffic shifts back automatically. These patterns turn deployments from high-stress events into routine, low-risk operations.

## Adoption Guidance

### Level 1. Foundational

- Set up a basic CI pipeline that builds your application and runs unit tests on every commit or pull request.
- Store all application code, configuration, and infrastructure definitions in version control. Nothing lives only on someone's laptop.
- Document your current deployment process step by step, even if it is mostly manual. You need to know what you are automating.
- Establish a single, consistent branching strategy across the team. Trunk-based development is preferred, but even a well-managed GitFlow is better than chaos.
- Create a versioned artifact for every build. Stop deploying by copying files to a server.
- Ensure you have at least one non-production environment that is reasonably close to production for testing deployments.

### Level 2. Adopted

- Automate the full pipeline from build through deployment to at least one environment. No manual steps in the critical path.
- Add integration tests, static analysis, and security scanning as automated quality gates in the pipeline.
- Implement automated database migrations as part of the deployment process.
- Use infrastructure as code to provision and configure environments. No manual server setup.
- Introduce feature flags for at least your highest-risk changes.
- Track deployment frequency, lead time, and change failure rate as key metrics.

### Level 3. Optimized

- Deploy to production multiple times per week (or per day) with full automation and zero downtime.
- Use canary deployments or blue-green deployments to validate changes in production before full rollout.
- Feature flags are used as standard practice for all significant changes, with a lifecycle process to clean up old flags.
- Automated rollback triggers on key metrics like error rate spikes or latency increases.
- Pipeline runs complete in under 15 minutes for typical changes.
- The team contributes shared pipeline components, templates, or libraries that other teams can use.

## Minimum Standards

1. All application source code, configuration, and infrastructure definitions must be stored in version control.
2. Every application must have a CI pipeline that builds and runs automated tests on every code change.
3. Build artifacts must be versioned and immutable. The same artifact must be promoted across environments.
4. Deployments to all environments must be automated. No manual file copying, no SSH-and-pray.
5. Database schema changes must be managed through versioned, automated migration scripts.
6. The pipeline must include at least unit tests and static analysis as automated quality gates.
7. Every application must have a documented and tested rollback procedure that can be executed in under 30 minutes.
8. Production deployments must be linked to an approved change record as required by the firm's change management policy.
9. Deployment credentials and secrets must be managed through a secrets management tool, never hardcoded or stored in source control.
10. Each application or service must be deployable independently without requiring coordinated deployment of other applications.

## Scoring Criteria

| Area | Level 1 | Level 2 | Level 3 |
|------|---------|---------|---------|
| Pipeline Automation | CI pipeline runs builds and unit tests on every commit | Full CI/CD pipeline with automated deployment to at least one environment | Full CI/CD with automated production deployment, canary or blue-green strategy |
| Quality Gates | Unit tests run automatically in the pipeline | Integration tests, static analysis, and security scanning are automated gates | All gates run in under 15 minutes with automated rollback on failure |
| Environment Management | At least one non-production environment exists for testing | Environments provisioned through infrastructure as code | All environments are ephemeral, reproducible, and identical to production |
| Deployment Frequency | Monthly or less frequent, possibly with manual steps | Weekly deployments with full automation | Multiple deployments per week or per day with zero downtime |
| Feature Management | No feature flag capability in place | Feature flags used for high-risk changes | Feature flags are standard practice with lifecycle management and cleanup |
| Rollback Capability | Documented rollback procedure, may be partially manual | Automated rollback that can execute in under 15 minutes | Automated rollback triggered by metric thresholds within minutes |

## Anti-Patterns

- **The Big Bang Release.** Twelve applications all deploy together during a quarterly release weekend because nobody is confident they can deploy independently. If one change breaks, everything rolls back. This is the opposite of independent deployability.

- **The Snowflake Environment.** Production was configured by hand three years ago and nobody fully understands it. Dev and staging are different in subtle ways. Bugs appear in production that nobody can reproduce locally because the environments do not match.

- **The Shared Pipeline Bottleneck.** A single CI/CD server or a single operations team handles deployments for 30 applications. Teams submit tickets and wait in line. A backlog of deployment requests builds up at the end of every sprint.

- **The Manual Deployment Runbook.** Deployment means following a 47-step document in Confluence. Different people interpret the steps differently. Someone always forgets step 23. When it fails, nobody is sure which step went wrong.

- **The Long-Lived Feature Branch.** A team works on a feature branch for six weeks, then tries to merge. The merge conflicts are massive. The integration testing reveals incompatibilities. The deploy is delayed by another two weeks to sort it out.

- **The Hardcoded Configuration.** Database connection strings, API keys, and environment-specific settings are baked into the build. Deploying to a different environment means rebuilding the artifact with different values, breaking the principle of immutable artifacts.

- **The "We'll Test in Production" Approach.** Skipping automated tests because "they take too long" or "they are flaky." Bugs that could have been caught in the pipeline show up in production, often during high-traffic periods like end-of-month payment processing.

- **The Unversioned Database Change.** Schema changes are applied manually by a DBA using ad-hoc scripts. There is no record of what changed, no way to roll back, and no way to reproduce the same change in another environment.

## Getting Started

1. **Map your current deployment process.** Write down every step your team follows to deploy to production, from code merge to live traffic. Include the manual parts, the waiting, and the approvals. This gives you a clear picture of where automation will have the most impact.

2. **Set up a basic CI pipeline this week.** Pick your CI tool (Jenkins, GitHub Actions, GitLab CI, Azure DevOps, whatever your organization supports) and configure it to build your application and run your existing tests on every pull request. Even if your test coverage is low, start here.

3. **Automate one environment deployment.** Pick your dev or test environment and automate the deployment end to end. Get comfortable with the tooling and work out the kinks before tackling staging and production.

4. **Put your database migrations under version control.** Start using a migration tool like Flyway or Liquibase. Every schema change from this point forward should be a versioned migration script, not a manual SQL statement.

5. **Talk to your change management team.** Understand what approvals and evidence are required for production deployments. Build those requirements into your pipeline from the start rather than treating compliance as something you bolt on later.

*This tenet is part of the Architecture Modernization initiative. See the [Architecture Tenets Overview](./00-Architecture-Tenets-Overview.md) for the full list of tenets, the maturity model, and the scoring framework.*
