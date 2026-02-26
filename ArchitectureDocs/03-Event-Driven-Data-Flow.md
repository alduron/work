# Event-Driven Data Flow

## Purpose

Most integration problems across the firm come down to one thing: systems are too tightly coupled. When one system calls another synchronously and that dependency is down, everything upstream is down too. Event-driven data flow fixes this by flipping the model. Instead of systems calling each other directly and waiting for a response, they publish events that describe what happened. Other systems subscribe to those events and react on their own schedule. This pattern also unlocks real-time processing for things that should never have been batch in the first place, like compliance reporting, notifications, and risk calculations.

## Key Principles

- Events describe facts that already happened, not commands to execute
- Producers have zero knowledge of their consumers
- Events are immutable once published
- Consumers must be idempotent because duplicate delivery will happen
- Events carry enough context for consumers to act without calling back to the producer
- All events are versioned from day one
- Messaging infrastructure guarantees at-least-once delivery
- Eventual consistency is accepted and designed for explicitly
- No sensitive data (PII, account numbers) in event payloads without encryption or tokenization

## How This Applies by Architecture Model

### Modular Monolith

- Use an in-process event bus to decouple modules within the monolith. One module publishes an event and another module reacts to it without a direct dependency. This does not require external messaging infrastructure. There is no need to install Kafka, RabbitMQ, or any message broker for events that flow between modules inside the same application. The event bus is an object that lives in memory within your process.
- Most frameworks already have this capability built in. Spring provides `ApplicationEventPublisher` out of the box. .NET has MediatR's `INotification` pattern. Python frameworks can use a simple pub/sub class, the `blinker` library, or `fastapi-events`. Node.js has `EventEmitter` built into the runtime, and NestJS has `@nestjs/event-emitter`. If none of these fit, you can write a basic event bus in under 50 lines of code. It is a list of handlers keyed by event name, and a publish method that calls them.
- Domain events should flow through the event bus, not through direct method calls between modules. This keeps your module boundaries clean even though everything runs in the same process.
- Keep event handlers in the consuming module, not the producing module. The producing module should not contain logic about what happens in downstream consumers.
- Start building your event catalog now, even if the events only flow in-process. When you eventually extract a module into its own service, these same events become integration events with minimal rework.
- Use transactional outbox patterns if your in-process events need to be reliably delivered. Saving the domain state and publishing the event should happen atomically.

### Macrocomponents

- Once events need to cross process boundaries, meaning one separately deployed application needs to communicate with another, that is when a message broker becomes relevant. Introduce a broker (Kafka, RabbitMQ, or Azure Service Bus depending on your platform) as the backbone for communication between your separately deployed services. Direct service-to-service HTTP calls should be the exception, not the norm. If your domains all live inside a single application, you do not need a broker. The in-process event bus described above is sufficient.
- Each macrocomponent publishes integration events to shared topics. One service publishes an event to a topic, and other services subscribe independently.
- Use dead letter queues for messages that fail processing. You cannot afford to silently drop events. Every failed message needs to be visible, trackable, and retryable.
- Define clear ownership of topics and event schemas. The producing service owns the schema. Consumers adapt to it. Do not let consumers dictate what the producer publishes.
- Implement correlation IDs that flow through every event in a business process. The same correlation ID should be traceable from the initial request through every downstream event.

### Microservices

- Favor choreography over orchestration for most cross-service workflows. Each service reacts to events independently rather than having a central coordinator. This keeps services truly autonomous. Use orchestration (saga pattern) only for complex workflows where you need compensating transactions.
- Consider event sourcing for domains where the full history of state changes has business value. Transaction ledgers, audit trails, and compliance records are natural fits.
- Implement consumer groups so that multiple instances of the same service share the load without processing the same event twice. This is critical when you scale horizontally.
- Use schema registries to enforce event contract compatibility. A producer should not be able to publish a breaking schema change without the registry flagging it.
- Build your services to be resilient to event reordering. Network partitions and retries mean events can arrive out of order. Your consumers should handle this gracefully, either by using sequence numbers or by designing for commutativity.

## Event Types and When to Use Them

Not all events are the same, and treating them as interchangeable leads to messy architectures. There are three types you should understand and use deliberately.

**Domain events** represent something meaningful that happened within a single bounded context. These are the core building blocks. `IncidentCreated`, `WorkflowCompleted`, `ApprovalGranted`. They use the language of the domain and carry the detail needed for internal processing. In a modular monolith, these flow through the in-process event bus. In services, they may stay internal to the service or get promoted to integration events when other services need to know.

**Integration events** are published for consumption by other services or bounded contexts. They are a deliberate, curated subset of what happens internally. A service might raise dozens of internal domain events during a complex operation, but it only publishes one or two as integration events. Integration events should be stable, versioned, and documented in your event catalog. They form the contract between services. Keep the payload lean. Include what consumers need, not everything you have.

**Notification events** are lightweight signals that something happened, carrying minimal payload. They exist to tell consumers "go check for updates" rather than carrying the full state change. A notification event might contain just an entity ID and a timestamp. The consuming service then calls an API to fetch the current state if it cares. These are useful when the full event payload would be large, when different consumers need different levels of detail, or when the data is sensitive and you want to control access through API authorization rather than putting sensitive data on a message bus.

The key decision is how much data to put in the event. You need to be especially careful about sensitive data flowing through messaging infrastructure, since it can have regulatory implications. Often, a notification event with a callback to a secured API is the right pattern for sensitive data, while a full integration event works fine for less sensitive operational data.

## Event Sourcing and CQRS Considerations

Event sourcing means storing the full sequence of events that led to the current state rather than just storing the current state. Instead of a row in a database that says "current value is X," you store every change that got it there. This is powerful for domains where the history is the product. Audit trails, regulatory reporting, change tracking, and dispute resolution all benefit enormously. You can replay the exact sequence of events and show precisely what happened and when.

That said, event sourcing adds real complexity. You need to handle event versioning, snapshot strategies for performance, and the mental shift of thinking in events rather than state. For a straightforward CRUD service that manages customer preferences or internal configuration, event sourcing is overkill. Use it where the business genuinely values the history, not just because it sounds architecturally elegant.

CQRS (Command Query Responsibility Segregation) pairs naturally with event-driven architecture. The idea is simple. Separate your write model from your read model. Commands go through domain logic and produce events. Those events are projected into read-optimized views that serve queries. This means your write pipeline can be optimized for correctness and durability while your read paths hit fast, denormalized stores. You do not need full event sourcing to use CQRS. Even with a traditional database on the write side, you can project changes as events into read-optimized stores. Start with CQRS where you have clear read/write asymmetry (many more reads than writes, or very different read and write models) and expand from there.

## Adoption Guidance

### Level 1. Foundational

- Identify the key domain events in your application and document them, even if they are not implemented yet. Build an event catalog.
- Implement at least one in-process event flow where a domain action triggers a reaction in a different module without a direct method call.
- Establish naming conventions for events. Use past tense (`TransactionPosted`, not `PostTransaction`). Be consistent.
- Set up a dead letter queue or error handling strategy for any async processing you already have.
- Audit your current synchronous integrations and flag the ones that would benefit most from becoming event-driven. Prioritize by fragility and business impact.

### Level 2. Adopted

- All new cross-module or cross-service communication uses events by default. Synchronous calls are the exception and require justification.
- A message broker is deployed and operational. Teams publish and subscribe to well-defined topics with documented schemas.
- Integration events are versioned and registered in a schema registry or event catalog that other teams can discover.
- Idempotent consumers are standard practice. Every event handler can safely process the same event twice without side effects.
- Correlation IDs flow through all events in a business process. You can trace an action from start to finish across services.
- Monitoring and alerting are in place for event processing lag, dead letter queues, and consumer health.

### Level 3. Optimized

- Event sourcing is used in domains where audit history and event replay have clear business value (transaction ledgers, compliance records).
- CQRS is implemented for high-traffic read/write paths with clear separation of read and write stores.
- Event-driven sagas handle complex, multi-step business processes with proper compensating transactions for failure scenarios.
- The team contributes reusable event infrastructure (shared libraries, schema templates, monitoring dashboards) back to the organization.
- Event flows are performance-tested under realistic load scenarios (peak volumes, end-of-day processing spikes).
- The team can demonstrate event replay capabilities for debugging, auditing, and disaster recovery.

## Minimum Standards

1. Every application must have a documented event catalog listing the domain events it produces and consumes, even if those events only flow in-process.
2. All event handlers must be idempotent. Processing the same event twice must produce the same result with no unintended side effects.
3. Events must use past-tense naming that reflects the domain language (e.g., `AccountOpened`, `TransactionPosted`, `FraudDetected`).
4. Events must include a unique event ID, a timestamp, a correlation ID, and a schema version.
5. Any event carrying personally identifiable information (PII) or sensitive financial data must be flagged in the event catalog and handled according to the firm's data classification policy.
6. Dead letter queues or equivalent error handling must be configured for all async event processing. Failed events must not be silently dropped.
7. Event schemas must be backward compatible. Adding fields is fine. Removing or renaming fields requires a new event version.
8. Cross-service event contracts must be documented and discoverable by other teams through a shared catalog or registry.
9. All event-driven workflows must have monitoring that tracks processing lag, error rates, and consumer group health.
10. Synchronous service-to-service calls that could be replaced by events must be documented as technical debt with a migration plan.

## Scoring Criteria

| Area | Level 1 | Level 2 | Level 3 |
|------|---------|---------|---------|
| Event Catalog | Domain events are identified and documented for the application | Integration events are versioned and published to a shared registry that other teams can discover | Event catalog is comprehensive, auto-generated from code, and includes lineage showing producer-consumer relationships |
| Messaging Infrastructure | Basic async processing exists (in-process event bus or simple queue) | A production message broker is in use with defined topics, consumer groups, and dead letter queues | Event infrastructure supports replay, partitioning, and handles peak transaction volumes with headroom |
| Consumer Resilience | Event handlers exist but may not be fully idempotent or fault-tolerant | All consumers are idempotent with retry logic and dead letter handling | Consumers handle out-of-order delivery, schema evolution, and can be replayed from any point in time |
| Observability | Basic logging of event processing exists | Correlation IDs flow through all events with dashboards showing processing lag and error rates | Full distributed tracing across event flows with alerting on SLO breaches and anomaly detection |
| Schema Management | Events have a defined structure but no formal versioning | Schemas are versioned and backward compatible. Breaking changes go through a review process | A schema registry enforces compatibility rules automatically and blocks breaking changes at publish time |
| Event Design | Events exist but may mix commands with events or carry too little context | Events follow naming conventions, carry sufficient context, and clearly separate domain events from integration events | Event design follows organization-wide standards with clear patterns for handling sensitive data, large payloads, and cross-domain workflows |

## Anti-Patterns

- **The God Event.** One massive event type that carries everything about an entity whenever anything changes. A `CustomerChanged` event with 200 fields instead of specific events like `CustomerAddressUpdated` or `CustomerPhoneNumberChanged`. This couples every consumer to every field and makes schema evolution painful.

- **Synchronous Disguised as Async.** Publishing an event and then immediately polling or waiting for a response event. If you need a response, just make a synchronous call. Do not add messaging infrastructure overhead for what is fundamentally a request-response pattern.

- **Event Sourcing Everything.** Applying event sourcing to simple CRUD domains where nobody cares about the history. Your internal application configuration does not need event sourcing. Your transaction ledger probably does. Be selective.

- **Leaking Internal Events.** Publishing internal domain events directly as integration events without curation. Your Accounts service might raise `AccountValidationStepThreeCompleted` internally, but no other service should see that. Curate what you publish externally.

- **Chatty Events Without Payload.** Publishing notification-style events that force consumers to call back to your API for every single event. If most consumers need the same core data, put it in the event. Save notification events for genuinely large or sensitive payloads.

- **Ignoring Dead Letters.** Setting up dead letter queues and then never monitoring them. A dead-lettered event could mean downstream data is wrong, a report is incomplete, or a critical alert was missed. Treat dead letters as production incidents.

- **Temporal Coupling Through Event Ordering.** Building consumers that break if events arrive in a different order than expected. Network partitions and retries will reorder your events. Design your consumers to handle this, or you will have mysterious production failures during infrastructure hiccups.

- **Putting Secrets on the Bus.** Including full credit card numbers, social security numbers, or authentication tokens in event payloads that flow through shared messaging infrastructure. Use references (like a tokenized ID) and let consumers retrieve sensitive details through authorized API calls.

## Getting Started

1. **Map your current integrations.** Draw a diagram of how your application talks to other systems today. Identify which integrations are synchronous, which are batch, and which already use messaging. Highlight the ones that cause the most pain when downstream systems are slow or unavailable.

2. **Define your first domain events.** Pick one bounded context in your application and list the meaningful things that happen there. Write them down in a simple event catalog with names, descriptions, and payload schemas.

3. **Implement an in-process event bus.** Use your framework's built-in event support or write a simple pub/sub abstraction. Publish a domain event from one module and handle it in another. This is not a stepping stone to a message broker. For most applications where domains live inside the same process, an in-process event bus is the end state. It builds clean module boundaries with zero infrastructure overhead.

4. **Pick one synchronous integration to convert.** If your application communicates with other separately deployed applications, find a synchronous call that causes reliability problems when the other system is slow or unavailable. Replace it with an event-based flow using a message broker. Implement the outbox pattern, set up a dead letter queue, and make your consumer idempotent. This step only applies when events need to cross process boundaries. If all your domains live within one application, step 3 is where you should focus your effort.

5. **Establish monitoring from day one.** Before you go live with any event-driven flow, make sure you can see what is happening. Track event publishing rates, consumer lag, dead letter queue depth, and processing errors. You will thank yourself during the first production incident.

---

*This tenet is part of the [Architecture Modernization Tenets](./00-Architecture-Tenets-Overview.md). It should be read alongside [API-First Contracts](./04-API-First-Contracts.md) for integration patterns and [Data Freshness and Access Patterns](./06-Data-Freshness-and-Access-Patterns.md) for the read-side of event-driven architectures.*
