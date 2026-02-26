# AI-Ready Architecture

## Purpose

AI and machine learning are being embedded into operations across the firm right now. AI-ready architecture means building the hooks, pipelines, and interfaces now so your application is not a dead end when the time comes. You do not need to build AI features today, but you do need clean data access patterns, well-defined events, and integration points where model outputs can plug into business processes without a rewrite.

---

## Key Principles

- Application data is accessible through well-defined interfaces, not locked behind direct database access
- ML and analytical workloads never run against the production transactional database
- Domain events carry enough context for ML pipelines to consume without callbacks
- Applications are designed to call ML models, not to build them
- Data access is governed through fine-grained controls and data contracts, not blanket lockdowns
- Computed features (like "average transaction amount over 30 days") are built once and stored for reuse
- Workflows capture outcomes so AI models can receive feedback for retraining
- All data exposed for AI/ML use has a classification label and defined access policy

---

## How This Applies by Architecture Model

### Modular Monolith

- Expose your domain data through internal data access modules that have clean interfaces. Even inside a monolith, ML pipelines should not need to understand your internal schema. Publish data through a dedicated access layer.
- Emit domain events to a message broker like Kafka or RabbitMQ. These events become the feed that analytics and ML pipelines consume. Start with key business events like account opened, transaction completed, or claim submitted.
- Create a read-optimized data export that pushes snapshots or change data capture (CDC) streams to an analytical data store. This keeps ML workloads off your production database.
- Build a thin integration layer where your application can call out to an ML model service and receive a score or classification. Keep this behind an interface so you can swap models or providers without changing business logic.

### Macrocomponents

- Each macrocomponent should own its data export pipeline. Do not create a central team that extracts data from every service. Let each service publish its own data products through events or dedicated data APIs.
- Use a shared event backbone like Kafka for cross-service event streaming. ML pipelines subscribe to the topics they need. Events should follow a shared schema standard so that consumers do not need deep knowledge of each service.
- Stand up a shared feature store that macrocomponents can write computed features into. This avoids duplication where three different services all compute "customer lifetime value" slightly differently.
- Design AI integration as a service boundary. Fraud scoring, credit decisioning, and document classification should be separate services that your macrocomponents call through well-defined APIs, not embedded logic.
- Implement data contracts between macrocomponents and ML consumers. When your service changes its event schema, downstream ML pipelines should not break silently.

### Microservices

- Each microservice publishes domain events that are rich enough to support ML consumption without requiring additional API calls. The event is the data product.
- Use a centralized or federated feature store that microservices contribute to. Each service computes the features it owns and publishes them. ML teams consume features from the store, not from individual services.
- Deploy ML models as their own microservices with versioned APIs. Application services call the model service, get a prediction, and incorporate it into their workflow. Model updates and application updates are completely independent.
- Implement real-time streaming pipelines alongside your event-driven architecture. Services like fraud detection need sub-second inference, which means the data pipeline from event to model to decision must be fully streaming.
- Build observability into AI integration points. Track model call latency, prediction distributions, and error rates just like you would for any other service dependency. If a fraud model starts returning unusual scores, you need to know immediately.

---

## Data Accessibility for AI/ML

The biggest barrier to AI adoption is not model building. It is data access. Most enterprise applications store data in relational databases optimized for transactions, not for the kind of wide, denormalized, time-series queries that ML workloads need. The first step toward AI-readiness is making your data accessible without compromising your production system.

Start with change data capture. CDC tools like Debezium can stream every insert, update, and delete from your database to an event stream like Kafka. From there, data lands in an analytical store, whether that is a data lake, a data warehouse, or both. Your production database stays untouched. ML teams get the data they need in near real-time. This pattern works regardless of your architecture model.

Feature stores are the next layer. A feature store is a shared repository of computed values that ML models use as input. Instead of every model team writing their own SQL to compute "average monthly balance" or "days since last transaction," you compute these features once and serve them consistently. This eliminates discrepancies between training and serving, which is one of the most common causes of model failure in production. Tools like Feast, Tecton, or cloud-native feature stores from AWS and Azure handle this well.

For sensitive data, use tokenization, anonymization, or differential privacy techniques before data enters the ML pipeline. Regulations require this, and your data platform should enforce it automatically. Do not rely on individual teams to get this right. Build it into the pipeline so that by the time data reaches the feature store, it is already compliant.

---

## Integrating AI-Driven Decisions

Building a great ML model is only half the problem. The other half is getting its predictions into your application at the right time, in the right format, with appropriate fallback behavior. This is the integration challenge, and it requires thoughtful design.

The simplest pattern is synchronous inference. Your application calls an ML model endpoint, passes in the features, and gets back a prediction. Fraud scoring at the point of transaction authorization is a good example. The model receives transaction details, returns a risk score, and your application uses that score to approve, decline, or flag the transaction for review. Keep the model call behind an abstraction, like a strategy pattern or a service interface, so you can update models, add champion-challenger testing, or fall back to rules-based logic without changing your core workflow.

For use cases where latency is less critical, asynchronous inference works well. Document classification is a good example. A customer uploads a document, your application publishes an event, and a downstream ML service classifies it and updates the record. Anti-money laundering batch scoring is another case where you score a portfolio of customers overnight and surface alerts the next morning. The key design decision is how your application handles the period between request and result. Build your UI and workflow to gracefully handle pending states and eventual results.

---

## Adoption Guidance

### Level 1. Foundational

- Identify the data assets in your application that are relevant to AI/ML use cases. Document what data you produce, what format it is in, and where it lives.
- Ensure your application emits key domain events to a message broker, even if no ML consumer exists yet. Getting the events flowing is the critical first step.
- Establish a basic data export mechanism, whether CDC, scheduled batch exports, or a data API. ML teams should be able to access your data without asking you to write custom queries.
- Review your database schemas and ensure key entities have proper timestamps, audit columns, and consistent identifiers that ML pipelines can use for joining data across sources.
- Document any sensitive data fields and the masking or anonymization rules that apply to them. This is a prerequisite for any compliant ML pipeline.

### Level 2. Adopted

- Your domain events are rich, well-documented, and follow a shared schema standard. ML consumers can subscribe to them and get useful data without additional context.
- A CDC or streaming pipeline is running in production, feeding data to an analytical store or feature store. This is not a prototype. It is an operational pipeline with monitoring.
- Your application integrates with at least one ML model in production, whether for fraud scoring, document classification, credit decisioning, or another use case.
- Computed features that your application owns are published to a feature store and used by at least one ML model.
- Data contracts exist between your application and its ML consumers. Schema changes go through a review process that includes downstream impact analysis.
- Sensitive data is automatically masked or tokenized before entering the ML pipeline. This is enforced by the pipeline, not by manual process.

### Level 3. Optimized

- Real-time streaming pipelines support sub-second data delivery to ML models for latency-sensitive use cases like fraud detection or transaction monitoring.
- Your application participates in feedback loops where model predictions are compared against actual outcomes, and this data flows back to improve model accuracy.
- Feature computation is fully automated, versioned, and served consistently for both model training and real-time inference.
- Champion-challenger model testing is supported by your integration layer. You can route a percentage of traffic to a new model version and compare results before full rollout.
- Your team actively contributes to the organization's data and AI platform, sharing features, event schemas, and integration patterns that other teams can reuse.
- AI integration points have full observability with alerts on model latency, prediction drift, and error rates.

---

## Minimum Standards

1. Your application must emit domain events for all significant business actions to a shared message broker. Events must include enough context for downstream consumers to use without calling back.

2. Your production database must not be directly accessed by any ML pipeline, reporting tool, or analytical workload. Use CDC, data APIs, or event streams to provide data access.

3. All data exported for ML consumption must go through a pipeline that enforces data governance rules, including masking of PII and compliance with data residency requirements.

4. Your application must have a documented data catalog entry that describes the data it produces, the events it emits, and the access patterns it supports.

5. Any integration with an ML model must be behind an abstraction layer. You must be able to swap model versions, fall back to rules-based logic, or disable the model entirely without a code change to your core business logic.

6. Event schemas and data export schemas must be versioned and registered in a shared schema registry. Breaking changes require a deprecation process.

7. Your application must handle ML model unavailability gracefully. If a fraud scoring service is down, your application must have a defined fallback behavior, not an unhandled exception.

8. Sensitive data fields must be classified and tagged in your schema. Any data pipeline that exports this data must respect those classifications automatically.

---

## Scoring Criteria

| Area | Level 1 | Level 2 | Level 3 |
|------|---------|---------|---------|
| Data Events | Key domain events are emitted to a message broker with basic structure | Events follow a shared schema standard, are documented, and carry rich context for ML consumption | Events support real-time streaming with sub-second delivery and are used by multiple ML consumers |
| Data Pipelines | A basic data export exists, either batch or CDC, that makes application data available outside the production database | CDC or streaming pipeline is operational with monitoring, feeding an analytical store or feature store | Fully automated, real-time streaming pipelines with data quality checks and schema evolution support |
| ML Integration | No ML integration, but integration points are identified and the application design supports future model calls | At least one ML model is integrated into a production workflow with proper abstraction and fallback behavior | Multiple ML integrations with champion-challenger testing, feedback loops, and full observability |
| Feature Management | Key data assets and potential features are documented | Computed features are published to a feature store and used by at least one model | Feature computation is versioned, automated, and served consistently for training and real-time inference |
| Data Governance | Sensitive fields are documented and classification rules are defined | Masking and tokenization are enforced automatically in the data pipeline | Governance is fully automated with lineage tracking, compliance auditing, and fine-grained access controls |
| Resilience and Fallback | Fallback behavior for ML model unavailability is documented | Fallback logic is implemented and tested, with graceful degradation in production | Automated failover between model versions, circuit breakers on model calls, and continuous resilience testing |

---

## Anti-Patterns

- **The data hostage.** Your application stores critical data but provides no way for ML teams to access it. Every AI project starts with a six-month data extraction effort. This is the single most common barrier to AI adoption across the firm.

- **Production database as ML warehouse.** An ML team points their training pipeline directly at your production database. Training jobs run heavy queries during business hours, and one day a feature engineering query locks a critical table during peak processing. Keep ML workloads off your transactional database, always.

- **The model black box.** You integrate a fraud scoring model but have no observability on it. You cannot see how many transactions it scores, what the score distribution looks like, or whether latency is increasing. When the model starts producing garbage scores after a data pipeline change, nobody notices for two weeks.

- **Copy-paste features.** Three different teams each compute the same derived metric using slightly different logic, different time windows, and different data sources. Model results are inconsistent and nobody can figure out why. Use a shared feature store.

- **Fire-and-forget model integration.** You call a credit decisioning model but never capture whether the decision was correct. The model has no feedback loop, so it never improves. Six months later, its accuracy has degraded and nobody knows because nobody is measuring it.

- **AI without governance.** A team builds a model using raw data that includes PII and sensitive details. Nobody reviewed the data pipeline for compliance. The model works great until an audit finds that sensitive data was stored unmasked in a training dataset on a shared storage account.

- **The brittle integration.** You hard-code a fraud model's API endpoint and response format directly into your transaction processing logic. When the ML team deploys a new model version with a slightly different response schema, your payment processing pipeline breaks in production.

- **Real-time aspirations, batch reality.** You build a fraud detection system that needs real-time transaction scoring, but your data pipeline runs nightly batch exports. By the time the model sees a suspicious transaction, the money is already gone. Match your data pipeline latency to your use case requirements.

---

## Getting Started

1. **Inventory your data assets.** Make a list of the key data your application produces. Write down where each piece lives, what format it is in, and who consumes it today. This is your starting point for any AI initiative.

2. **Start emitting domain events.** Pick three to five important business actions in your application and publish them as events to your message broker. Account opened, transaction authorized, claim submitted, document uploaded. You do not need ML consumers on day one. Just get the data flowing.

3. **Set up change data capture.** Get CDC running against your database and streaming changes to Kafka or your event platform of choice. This gives ML teams access to your data without touching your production system. Most CDC tools can be set up in a few days.

4. **Build one ML integration point.** Pick a use case where your application could consume an ML prediction. Fraud scoring on a transaction, document classification on upload, or risk scoring on an account action. Build the integration behind an abstraction with a fallback to rules-based logic. Even if the model does not exist yet, having the hook in place makes future integration trivial.

5. **Talk to your data and ML teams.** Find out what data they wish they had from your application. The answer will almost certainly be "everything, in real-time, with proper schemas." Start with what is feasible and build from there.
