# Domain-Driven Architecture

## Purpose

Domain-Driven Architecture organizes your system around business capabilities instead of technical layers. Each bounded context has its own language, data, and rules with clear ownership, so teams can evolve their part of the system independently without breaking something in another domain. Across the firm, the same business terms often mean different things depending on which application you are in, and explicit domain boundaries prevent the data inconsistencies and coordination nightmares that come from that ambiguity.

## Key Principles

- Domains own their logic, data, and interfaces regardless of deployment model
- Shared database clusters are allowed with strict schema ownership per domain
- No cross-domain writes
- Cross-domain reads go through defined interfaces or read models/projections
- Domains publish events for meaningful state changes
- Boundaries reflect business process, not technical layers
- No domain should require deep knowledge of another domain
- Each bounded context has an explicitly documented boundary and owner
- Code and conversation use the same terms (ubiquitous language within each context)
- Duplication across domains is acceptable when it preserves independence

## How This Applies by Architecture Model

### Modular Monolith

- Define modules along domain boundaries. Each module represents a bounded context. For example, an enterprise application might have modules for Incident Management, Workflow Engine, Notifications, and Reporting. Keep these in separate namespaces or packages.

- Enforce module boundaries through access controls. Use your language's visibility features (internal classes, package-private access, module systems) to prevent one domain from directly calling another domain's internals. If you cannot enforce it technically, enforce it through code review and linting rules.

- Each module owns its own database schema or set of tables. Even though everything lives in one database, each module should only read and write its own tables. Cross-module data access goes through the module's public interface, never through direct table queries. To be clear, a "public interface" in a monolith is not a separate REST endpoint. It is a service class or interface that acts as the front door to that module. Other modules call methods on that interface. It is a method call within the same process, not a network call. The point is to have a defined boundary so that other modules are not reaching directly into your internal classes, repositories, or data access layers.

- Use in-process events to decouple modules. When one module needs to notify another module that a state change occurred, publish an in-process event rather than making a direct method call. This does not require installing a message broker like Kafka or RabbitMQ. Most frameworks have built-in support for this pattern. Spring has `ApplicationEventPublisher`, .NET has MediatR notifications, and Python frameworks can use a simple pub/sub class or a lightweight library. The event bus lives in memory inside your application. Events are plain data objects, and handlers are just methods that get called when an event is published. This keeps your modules loosely coupled and makes it easier to extract them later if you need to.

- Document the context map. Even in a monolith, draw a diagram showing which modules exist, what each one owns, and how they communicate. This is the single most valuable artifact for onboarding new developers.

### Macrocomponents

- Each macrocomponent owns one or more closely related bounded contexts. A "Risk Management" macrocomponent might contain risk assessment, scoring, and reporting. These are grouped because they share significant data and change together frequently.

- Define clear API contracts between macrocomponents. Each macrocomponent should expose a versioned API that other macrocomponents consume. No shared libraries with business logic crossing macrocomponent boundaries.

- Each macrocomponent owns its own data store. This is the point where you start splitting databases. Each macrocomponent has its own database. Cross-component data needs are served through APIs or events, not shared database access.

- Use events for cross-component communication where possible. When a significant state change occurs, the owning macrocomponent publishes an event. Other macrocomponents subscribe to that event and handle their own side of the workflow. Neither component depends on the other's internals.

- Align your teams to macrocomponent boundaries. One team (or a small group of teams) owns an entire macrocomponent, including its APIs, its data, and its deployment pipeline. This team makes decisions about the internal structure without needing approval from other teams.

### Microservices

- One microservice per bounded context, or per aggregate if the context is large. A single bounded context might be one service. A more complex context, if it is large enough, might be split into separate services for distinct aggregates.

- Each service owns its data completely. No shared databases, period. If a service needs data owned by another domain, it either gets it through an API call or maintains its own local copy updated via events.

- Design your service interfaces around domain operations, not CRUD. Instead of generic "update" endpoints, expose operations that speak the language of the business, like "approve request," "escalate incident," or "submit for review."

- Use domain events as the primary integration mechanism. Services communicate by publishing events about what happened in their domain. A "RequestApproved" event from one service is consumed by the Notification service, the Audit service, and any other interested subscriber. None of these services call each other directly.

- Guard against distributed monolith syndrome. If every request requires calls to five other services, and you cannot deploy any service without coordinating with three other teams, you do not have microservices. You have a distributed monolith. Redesign your context boundaries so each service can handle its core operations independently.

## Domain Ownership and Shared Databases

Most enterprise applications share a database. Sometimes multiple applications share the same database. This is reality, and pretending otherwise does not help anyone. The question is not whether you share a database today, but how you start establishing domain ownership even while sharing one.

The first step is to assign table ownership. Every table in your shared database should have exactly one owning domain. That domain is the only one allowed to write to those tables. Other domains can read from them in the short term, but the long-term goal is to eliminate cross-domain reads too. Document this ownership in a simple spreadsheet or wiki page. This alone is a huge improvement because it tells you who to talk to when a schema change is needed.

The second step is to introduce read interfaces or views. Instead of letting one domain query another domain's tables directly, have the owning domain expose a database view or a service method that provides the data the consuming domain needs. In a monolith, this is just a class with well-defined methods that returns the data other modules are allowed to see. It is not a separate HTTP endpoint or a standalone service. It is a clean boundary within your application code. This gives the owning team freedom to change their internal schema without breaking consumers. It also makes the dependency explicit and visible.

The third step, taken over time, is to split the data. As you gain confidence in your domain boundaries and your integration patterns mature, you start migrating domains to their own schemas or databases. This does not have to happen all at once. Start with the domain that changes most frequently or the one where shared access causes the most coordination pain. Putting an API or event stream in front of heavily shared tables is usually the highest-value move you can make.

## Using Events Within Domain-Driven Architecture

Events are how domains talk to each other without becoming tangled together. When a domain completes a significant action, it does not call three downstream services in sequence. Instead, it publishes an event. Each of those other domains subscribes to that event and handles its own part of the workflow. The publishing domain does not need to know who is listening or what they do with the information. This is the key to keeping domains independent.

Events are especially powerful in environments where workflows span multiple domains. A single business process might involve validation, compliance checks, notifications, and reporting. If you model this as a chain of direct service calls, any one failure cascades through the whole chain and every team has to coordinate deployments. If you model it as a series of domain events, each domain handles its part independently, retries on its own schedule, and can be deployed without affecting the others.

When designing domain events, name them in the past tense and in the language of the business. Each event should carry enough data for consumers to act on it without calling back to the publishing service. This does not mean cramming everything into the event payload. It means including the key identifiers and the business-relevant facts. If a consumer needs more detail, it can call back, but the common case should be self-contained.

## Adoption Guidance

### Level 1. Foundational

- The team has identified and documented the bounded contexts within their application, even if the boundaries are not yet enforced in code.
- A shared glossary exists that maps business terms to technical concepts for each context. Business stakeholders have reviewed and agreed to the terminology.
- Database table ownership is documented. Every table has a designated owning domain, even if cross-domain access still happens.
- The team has drawn a context map showing how their domains relate to each other and to external systems.
- New code is being written with domain boundaries in mind, even if legacy code has not been refactored yet.
- The team can explain their domain model to a new developer in under 30 minutes using the documented context map and glossary.

### Level 2. Adopted

- Bounded context boundaries are enforced in code through modules, packages, or service boundaries. You cannot accidentally call into another domain's internals.
- Each domain has a well-defined public interface (API, event contract, or module interface) that other domains use for communication.
- Cross-domain database access is being actively eliminated. New features do not introduce new cross-domain table reads or writes.
- Domain events are used for at least some cross-context communication, reducing direct coupling between domains.
- The team's backlog and planning process is organized around domain capabilities, not technical layers.
- Code reviews include a check for domain boundary violations.

### Level 3. Optimized

- Every bounded context owns its data completely. There is no cross-domain database access.
- Domain events are the primary mechanism for cross-context integration. Direct synchronous calls between domains are the exception, not the rule.
- The Ubiquitous Language is embedded in the code. Class names, method names, and event names match the business vocabulary exactly.
- The team actively refines context boundaries based on what they learn from production. Boundaries evolve as the business evolves.
- The domain model is the primary communication tool between business and technology. Product owners and developers use the same terms, the same diagrams, and the same mental models.
- The team contributes domain modeling patterns and lessons learned back to the organization's architecture community of practice.

## Minimum Standards

1. Every application must have its bounded contexts identified and documented in a context map.
2. Every bounded context must have a defined owning team. No context can be unowned.
3. A shared glossary of business terms must exist for each bounded context, reviewed by business stakeholders.
4. Every database table must have a designated owning domain documented in a table ownership registry.
5. New code must be organized by domain, not by technical layer. New packages, namespaces, or modules must reflect business capabilities.
6. Cross-domain communication must happen through defined interfaces (APIs, events, or module contracts), not through direct access to another domain's internals.
7. Domain boundary violations discovered during code review must be treated as defects and tracked in the backlog.
8. The context map must be updated when domain boundaries change and must be reviewed at least once per quarter.

## Scoring Criteria

| Area | Level 1 | Level 2 | Level 3 |
|------|---------|---------|---------|
| Bounded Context Definition | Contexts are documented but not enforced in code | Contexts are enforced through module or service boundaries | Contexts are fully isolated with independent data stores |
| Ubiquitous Language | A glossary exists and is reviewed by the business | Code naming conventions match the glossary consistently | The domain language is the primary communication tool between business and tech |
| Data Ownership | Table ownership is documented in a registry | Cross-domain writes are eliminated and cross-domain reads are being reduced | Each context fully owns its data with no cross-domain database access |
| Cross-Context Communication | Dependencies between contexts are documented | APIs or events are used for cross-context communication | Domain events are the primary integration mechanism with minimal synchronous coupling |
| Team Alignment | The team knows which contexts they own | Team planning and backlogs are organized by domain | The team actively refines boundaries and contributes patterns to the organization |
| Context Map Currency | A context map exists and was created within the last 6 months | The context map is updated when boundaries change | The context map is a living artifact used in planning, onboarding, and architecture reviews |

## Anti-Patterns

- **The "Big Ball of Mud" domain.** Your application has no identifiable domain boundaries. Business logic for multiple capabilities is interleaved in the same classes and methods. A change to one workflow requires testing the entire application because nobody knows what else might break.

- **The identity crisis.** A key term means something different in every part of your system, but you use one shared class everywhere. One team adds a field and it breaks another team's code. This is a classic sign that you need separate bounded contexts with their own representations.

- **Shared database free-for-all.** Multiple domains read and write to the same tables with no ownership rules. The Payments team changes a column type and the Reporting team's nightly batch job fails. Nobody knew there was a dependency because it was never documented.

- **Domain in name only.** You created domain-named packages, but every class is public and there are no access restrictions. Developers routinely import classes from other domains because it is faster than going through the proper interface. The boundaries exist on paper but not in practice.

- **The God Service.** One service or module handles everything for a major business area. It manages five or six distinct capabilities that have nothing to do with each other. It is too large to reason about and too risky to change.

- **Translation layer explosion.** You created bounded contexts, but now you have dozens of translation layers mapping data between them. Every new field requires changes in five mapping classes. This often means your context boundaries are drawn in the wrong place. Revisit your context map.

- **Event soup.** You adopted domain events but have no catalog, no naming conventions, and no schema governance. Different teams publish events with conflicting formats for the same business concept, and consumers cannot tell them apart.

- **Ignoring the legacy.** You defined beautiful bounded contexts for new features but left the legacy codebase untouched. New code calls into old code with no clear boundary, and old code calls into new code through back doors. You end up with two architectures that are both half-implemented, which is worse than having one consistent approach.

## Getting Started

- **Draw your context map this week.** Get your team in a room with a whiteboard. Identify the 3 to 5 major business capabilities your application supports and draw the boundaries between them. It does not have to be perfect. A rough context map is infinitely better than none at all.

- **Build your glossary.** Pick one bounded context and write down the 10 to 15 most important business terms it uses. Define each one clearly. Then sit down with your business stakeholders and validate it. You will be surprised how many terms mean different things to different people.

- **Assign table ownership.** Export your database table list and go through it with the team. For each table, ask "which domain owns this?" Mark the ones that are clearly owned, flag the ones that are shared, and create a plan to address the shared ones over time.

- **Enforce one boundary in code.** Pick the cleanest boundary in your context map and enforce it. Create a proper module interface, make internal classes inaccessible to other modules, and route all cross-module communication through that interface. Start with one boundary and expand from there.

- **Add a domain boundary check to your code review checklist.** The simplest thing you can do today is start asking "does this change respect our domain boundaries?" during every code review. This costs nothing and builds the habit of thinking in domains.

*This tenet is part of the Architecture Modernization Tenets. See the [overview](./00-Architecture-Tenets-Overview.md) for context on how tenets work together, the maturity model, and the scoring framework.*
