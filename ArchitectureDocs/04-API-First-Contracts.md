# API-First Contracts

## Purpose

API-first means you design the contract before you write the implementation. You publish that contract in a format that consumers can read, validate against, and generate client code from. Without this discipline, teams integrate through undocumented endpoints or direct database access, and changes by one team silently break another. When every team designs contracts first, integration becomes predictable, teams can work in parallel, and breaking changes become visible before they reach production.

## Key Principles

- The API contract is designed before implementation begins
- Every API has a machine-readable contract (OpenAPI, Protobuf, or AsyncAPI)
- Every API has an explicit owner responsible for its contract and lifecycle
- Consumers depend only on the contract, never on implementation details
- No consumer should need to know your database schema to use your API
- All APIs are versioned
- Breaking changes require a deprecation notice, migration path, and consumer timeline
- All API contracts are published to a shared, discoverable catalog
- No direct database integration between systems. APIs are the only integration path

## How This Applies by Architecture Model

### Modular Monolith

- Define explicit interfaces between modules even though they run in the same process. Your accounts module should expose a clear interface to the lending module, not let it reach into internal classes or data access layers.
- Use interface contracts (TypeScript interfaces, Java interfaces, Kotlin sealed classes) to formalize what each module exposes. These are your internal API contracts.
- Document internal module contracts in the same catalog as external APIs. Even if they are not HTTP endpoints today, they represent integration boundaries that other teams depend on.
- Treat internal module interfaces as if they could become external APIs tomorrow. Because in a modernization journey, they often do. The module that is internal today might become a standalone service tomorrow.

### Macrocomponents

- Publish OpenAPI specs for all REST endpoints and Protobuf definitions for any gRPC communication between your macrocomponents. Every macrocomponent should have a versioned OpenAPI spec before any consumer writes a single line of integration code.
- Use API gateways or lightweight routing to manage traffic between macrocomponents. This gives you a single place to apply rate limiting, authentication, and versioning.
- Maintain backward-compatible APIs by default. When a macrocomponent adds a new field to a response, existing consumers should not break.
- Run contract tests in your CI pipeline. Before a macrocomponent deploys, verify that its API still satisfies the expectations of its known consumers.
- Register all macrocomponent APIs in the shared catalog with clear ownership, SLA expectations, and deprecation timelines.

### Microservices

- Use an API gateway as the front door for external consumers. Internal service-to-service calls can go direct, but anything crossing a trust boundary goes through the gateway. This is where you enforce authentication, rate limiting, and contract versioning.
- Adopt consumer-driven contract testing. Each consumer publishes a contract describing what it expects from a provider. The provider validates against all consumer contracts before deploying.
- Automate API spec generation and validation as part of your CI/CD pipeline. If a developer changes an endpoint signature, the build should fail if it violates the published contract.
- Version every service API independently. Your fraud detection service and your payment authorization service evolve at different speeds. Their APIs should version independently.
- Maintain a service mesh or API catalog that maps every service, its APIs, its consumers, and its current version. In a microservices architecture with dozens of services, you cannot manage contracts manually.

## API Versioning Strategy

Versioning is where API-first either works or falls apart. The goal is simple. Consumers should be able to upgrade on their own timeline, not yours. When an API needs a breaking change, the consumers calling it should not be forced into an emergency release.

URL-based versioning (like `/v1/resources` and `/v2/resources`) is the most straightforward approach and the one we recommend as the default. It is easy to understand, easy to route, and easy to monitor. You can see in your logs and metrics exactly which version each consumer is calling. Header-based versioning (using `Accept` headers or custom version headers) is cleaner from a purist REST perspective, but it is harder to debug and harder to manage in API gateways. If you have a strong reason to use header-based versioning, go ahead. But URL-based is the safe default for most enterprise applications.

Not every change needs a new version. Adding a new optional field to a response is not a breaking change. Adding a new endpoint is not a breaking change. Removing a field, renaming a field, changing a field's type, or altering the meaning of an existing field are all breaking changes. When you make a breaking change, you create a new version and run both versions in parallel until all consumers have migrated. For a critical API, that migration window might be 6 to 12 months.

Every API version needs a published deprecation policy. When you release v2, publish the sunset date for v1. Give consumers at least 90 days notice for internal APIs and 180 days for external-facing APIs. Send deprecation headers in responses from the old version. Track which consumers are still calling deprecated versions and reach out to them directly. Do not just turn off v1 and see what breaks.

## Contract Testing

Contract testing is how you verify that what a provider actually returns matches what its consumers expect. This is different from integration testing, where you spin up real services and run end-to-end scenarios. Contract tests are fast, isolated, and focused specifically on the shape and behavior of API interactions.

The most practical approach is consumer-driven contract testing. Here is how it works. The consumer writes a test that describes what it expects from the provider. That test produces a contract file. The provider runs that contract file against its actual implementation. If the provider's response matches what the consumer expects, the test passes. If someone on the provider team removes a field that the consumer depends on, the test fails before the change ever reaches production. Tools like Pact, Spring Cloud Contract, and Specmatic make this workflow straightforward.

Contract testing is more valuable than end-to-end integration testing for one specific purpose, which is catching API compatibility issues early. End-to-end tests are slow, flaky, and hard to maintain. They also tend to test business logic, not contract compliance. A contract test takes seconds to run, lives in your CI pipeline, and answers one question clearly. Does the provider still give the consumer what it needs? Across the firm where services have complex interdependencies, that fast feedback loop is critical. It means any team can deploy with confidence that they have not broken another team's integration.

## Adoption Guidance

### Level 1. Foundational

- Document all existing APIs in a shared location, even if it is just a spreadsheet or wiki to start. You need to know what you have before you can improve it.
- Pick an API specification format (OpenAPI 3.x for REST, Protobuf for gRPC, AsyncAPI for event-driven) and write specs for your most critical APIs. Start with the ones that have the most consumers.
- Establish a naming convention for API endpoints, fields, and error responses. Consistency matters more than perfection. Decide on camelCase vs snake_case and stick with it.
- Identify an owner for every API. If nobody owns it, assign someone now.
- Add basic versioning to any API that has more than one consumer. Even if it is just putting `/v1/` in the URL path.
- Set up a simple API catalog, even if it is just a Git repository with OpenAPI spec files organized by team.

### Level 2. Adopted

- All new APIs are designed contract-first. The OpenAPI spec is written and reviewed before implementation begins. No exceptions.
- Contract tests run in CI for APIs with multiple consumers. A failing contract test blocks deployment.
- API specs are auto-generated from code annotations or validated against the published spec as part of the build process.
- A central API catalog is operational and all teams publish their specs to it. Teams building new integrations check the catalog first.
- Deprecation policies are documented and followed. Deprecated API versions include sunset headers in their responses.
- API design reviews are part of the team's definition of done for any work that introduces or modifies an API.

### Level 3. Optimized

- Consumer-driven contract testing is standard across the organization. Every API consumer publishes contracts, and providers validate against them automatically.
- The API catalog includes live traffic data, showing which consumers are calling which versions. You know exactly who is still on v1.
- API governance is automated. Linting rules enforce naming conventions, versioning standards, and documentation completeness before a spec can be published.
- Teams contribute to shared API design guidelines and review each other's contracts through a community of practice.
- API mocks are auto-generated from specs, allowing consumer teams to start integration work before the provider has built anything.
- Breaking change detection is automated. The CI pipeline compares the new spec against the published version and flags any backward-incompatible changes.

## Minimum Standards

1. Every API that is consumed by another team or system must have a machine-readable contract (OpenAPI 3.x, Protobuf, or AsyncAPI).
2. API contracts must be published to the organization's shared API catalog and kept up to date with the running implementation.
3. Every API must include a version identifier in the URL path (e.g., `/v1/accounts/{id}`).
4. Breaking changes to an API must result in a new version. The previous version must remain available for at least 90 days after the new version is published.
5. Every API must have a documented owner (team or individual) who is responsible for the contract, versioning, and consumer communication.
6. API responses must use a consistent error format across the organization, including a machine-readable error code, a human-readable message, and a correlation ID for tracing.
7. API contracts must be validated in the CI pipeline. A build that produces an API response inconsistent with its published contract must fail.
8. No consumer may integrate with another team's system by directly accessing its database, message queue internals, or undocumented endpoints. The published API contract is the only supported integration path.
9. Deprecated API versions must return a `Sunset` header or equivalent deprecation notice in every response.

## Scoring Criteria

| Area | Level 1 | Level 2 | Level 3 |
|------|---------|---------|---------|
| API specification | Critical APIs have OpenAPI or Protobuf specs written and stored in a shared location | All APIs have specs, and new APIs are designed contract-first before implementation | Specs are auto-validated, linted, and include live traffic metadata in the catalog |
| Versioning | At least one API uses URL-based versioning with a `/v1/` prefix | All APIs are versioned and deprecation policies are documented and communicated | Breaking change detection is automated in CI, and consumer migration is tracked |
| Contract testing | Team is aware of contract testing and has run a proof of concept | Contract tests run in CI for APIs with multiple consumers and block deployment on failure | Consumer-driven contracts are standard, with all consumers publishing their expectations |
| API catalog and discovery | APIs are listed in a wiki, spreadsheet, or Git repository with basic ownership info | A central API catalog is operational with searchable specs, ownership, and SLA data | The catalog includes live traffic data, version usage stats, and automated deprecation tracking |
| Governance and standards | Naming conventions and error formats are documented for the team | API design reviews are part of the workflow, and linting rules catch common issues | Governance is fully automated with organizational linting, design review bots, and shared style guides |

## Anti-Patterns

- **Database-as-API.** A team queries another team's database tables directly because "it is faster than waiting for an API." This creates invisible coupling. When the owning team normalizes their schema, the consuming feature breaks with no warning and no one to call.

- **The Wiki Contract.** An API is "documented" in a Confluence page that was last updated 18 months ago. Half the endpoints have changed since then. New developers follow the wiki, build against endpoints that no longer exist, and waste days debugging before someone tells them to "just look at the code."

- **Versionless Evolution.** An API has been modified dozens of times over two years without ever incrementing a version. Fields have been renamed, removed, and repurposed. Every consumer has its own fragile set of workarounds. Nobody knows which fields are safe to rely on.

- **Spec Drift.** The team writes a beautiful OpenAPI spec during the design phase, then never updates it again. Six months later, the spec says the endpoint returns 8 fields but the actual response has 14. The spec is not wrong, exactly. It is just fiction.

- **Internal Means Informal.** Because an API is "internal only," the team decides it does not need a spec, versioning, or documentation. Then three other teams start consuming it. Then it becomes a critical dependency for a major workflow. Now you have an undocumented, unversioned API in a critical path with no contract and no owner.

- **Copy-Paste Integration.** Instead of consuming a published API, a developer copies the data model classes from another team's repository into their own codebase. Now you have two copies that will drift apart silently. When the source team updates their model, the copy does not change.

- **The God Endpoint.** A single `/api/process` endpoint accepts a JSON body with a `type` field that determines which of 30 different operations it performs. There is no discoverable contract. You have to read the source code to know what operations exist and what fields each one requires. It is untestable, undocumentable, and impossible to version.

- **Breaking Change by Surprise.** The fraud detection team renames a response field from `riskScore` to `fraudRiskScore` on a Friday afternoon. They did not realize the real-time alerts dashboard, the compliance reporting system, and the customer service portal all depend on that field. Monday morning starts with three incident tickets.

## Getting Started

1. **Inventory your current APIs.** List every API your team exposes and every API you consume from other teams. Note which ones have specs, which ones have documentation, and which ones have nothing. This gives you a clear picture of where you stand.

2. **Write an OpenAPI spec for your most-consumed API.** Pick the one that the most other teams depend on and start there. Write the spec to match what your API actually does today, not what you wish it did.

3. **Add the spec to the shared API catalog.** Publish it where other teams can find it. This does not need to be a fancy portal on day one. A Git repository with a clear folder structure works fine.

4. **Set up one contract test.** Pick your most important consumer relationship and write a contract test for it. Write a test that verifies your API still returns what consumers expect. Get it running in CI.

5. **Add versioning to your next API change.** The next time you need to make a change to an existing API, do it with a version bump instead of modifying the existing endpoint in place. This builds the muscle memory for your team and shows consumers that you take compatibility seriously.

---

*This is Tenet 4 of 11 in the Architecture Modernization framework. See the [Architecture Tenets Overview](./00-Architecture-Tenets-Overview.md) for context on how this tenet fits into the broader initiative.*
