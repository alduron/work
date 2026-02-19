# Data Modeling and Schema Discipline

## Purpose

When there is no discipline around how data is modeled, schema drift creeps in, ownership becomes unclear, and uncoordinated changes break downstream systems without warning. In a regulated environment this is not just inconvenient, it is a compliance risk. This tenet establishes the expectation that every application team thinks deliberately about how their data is structured, who owns it, how it changes over time, and how it gets shared.

---

## Key Principles

- Every shared data entity has a single, explicitly identified owner
- Shared data conforms to a canonical model agreed on across consumers
- Internal database schemas are separate from external data contracts
- All schema changes are versioned and backward-compatible by default
- Breaking schema changes require a migration plan and consumer notification
- Incoming data is validated against the expected schema at every boundary
- Data models are published in a discoverable catalog, not buried in code
- Schema changes that affect regulatory reporting require cross-team review before shipping
- No team changes another team's schema

---

## How This Applies by Architecture Model

### Modular Monolith

- Define a shared internal data model within your monolith, but enforce clear boundaries between modules. Each module should access data through defined interfaces, not by querying another module's tables directly.
- Use a single database, but organize tables by module with clear naming conventions. For example, prefix tables with the module name (`workflow_tasks`, `audit_records`) so ownership is obvious.
- Manage schema migrations through a single, ordered migration pipeline. Tools like Flyway or Liquibase work well here. Every migration should be reviewed for cross-module impact before it runs.
- When modules need to share data, define explicit shared data structures in a common library within the codebase. This makes the contract visible and testable.

### Macrocomponents

- Each macrocomponent owns its own database and schema. No direct cross-database queries. If one service needs data owned by another, it calls that service's API or consumes an event. It does not connect to the other service's database.
- Publish canonical event schemas for data that crosses service boundaries. When a significant state change occurs, the owning macrocomponent publishes a well-defined, versioned event.
- Maintain a shared schema registry (like Confluent Schema Registry or a simple Git-based catalog) so that all macrocomponents can discover and validate the schemas they depend on.
- Plan for data duplication. Each macrocomponent will maintain its own read-optimized copy of data from other services. This is fine as long as the source of truth is clear and the copies are updated through events.
- Coordinate schema migrations across macrocomponents using a lightweight change management process. This does not need to be heavyweight. A shared Slack channel or a brief review in your architecture sync meeting works.

### Microservices

- Each microservice owns its schema completely. Schema decisions are made by the team that owns the service. This is the whole point of service autonomy.
- Use a schema registry as a required part of your infrastructure. Every event and message schema must be registered, versioned, and validated at publish time. No unregistered schemas in production.
- Implement consumer-driven contract testing. The teams that consume your events or APIs define the shape of data they depend on, and your CI pipeline verifies that your changes do not break those contracts.
- Design for eventual consistency across services. In a microservices world, you will not have transactional consistency across service boundaries. Use sagas or choreography patterns to manage multi-step processes that span multiple services.
- Keep your internal persistence model completely decoupled from your published event schemas. You should be able to refactor your database without any consumer noticing.

---

## Schema Evolution and Versioning

Schema changes across the firm are not something you can take lightly. A field that gets renamed in one system might break a downstream system that generates a regulatory filing. A schema change might cascade through multiple dependent applications all at once. You need a strategy for evolving schemas safely.

The foundation is backward compatibility. When you change a schema, the new version should still be readable by consumers that understand the old version. This means you can add new optional fields freely. You can deprecate fields with advance notice. But you should almost never remove or rename a required field without a migration plan. The Avro and Protobuf ecosystems have well-established rules for compatible changes. Even if you use JSON, apply those same principles.

For breaking changes that cannot be avoided, use an explicit versioning strategy. Publish the new version alongside the old one, give consumers a migration window, and only retire the old version after all consumers have moved. In practice, this means running two versions of an event or API in parallel for a defined period. That window is often tied to a reporting cycle, so plan accordingly.

Regulatory reporting deserves special attention. If your data feeds regulatory reports, any schema change must be validated against the reporting requirements before it ships. This means involving your risk and compliance teams early. Not as a gate, but as a partner. They can tell you which fields are critical for which reports, and that saves everyone from a painful surprise when a filing comes back wrong.

---

## Data Ownership and Boundaries

The single hardest data problem across the firm is answering the question, "Who owns this data?" The honest answer is usually, "Everyone and no one." Multiple systems store overlapping data with slightly different fields, slightly different formats, and slightly different update frequencies. When they disagree, nobody knows which one is right.

The fix is not to force every system into a single shared database. That has been tried and it creates a bottleneck that slows every team down. Instead, designate one system as the authoritative source for each piece of data. Each system publishes its authoritative data through events or APIs, and other systems subscribe to those updates. They can store local copies for performance, but they do not get to overwrite the authoritative source.

Establishing these ownership boundaries takes real organizational work. It is not a purely technical exercise. You need business stakeholders, data stewards, and application teams to agree on who owns what. Start with the most contested data domains first, get those ownership lines drawn, document them, and enforce them through technical controls like API gateways and event schemas that only the owning system can publish to.

Once ownership is clear, the day-to-day work gets much simpler. Teams know where to go for the truth. Schema changes go through the owning team. Disputes have a clear escalation path. And your data quality improves because there is one team accountable for each critical data element, rather than fifteen teams all assuming someone else is handling it.

---

## Adoption Guidance

### Level 1. Foundational

- Document the primary data entities your application manages and their key fields.
- Identify which data your application considers authoritative versus data it receives from other systems.
- Use a schema migration tool (Flyway, Liquibase, EF Migrations, or similar) so that all schema changes are versioned and repeatable.
- Define a naming convention for database objects (tables, columns, keys) and apply it consistently to new work.
- Publish a basic data dictionary for your application's shared data, even if it is just a wiki page.
- Flag any known data quality issues or schema inconsistencies in your backlog.

### Level 2. Adopted

- Maintain canonical schemas for all data your application publishes to other systems, whether through APIs, events, or files.
- Use a schema registry or a versioned Git repository to manage and share your published schemas.
- Validate incoming data against expected schemas at your application's boundaries. Reject or quarantine data that does not conform.
- Apply backward-compatible schema evolution practices for all published data. No breaking changes without a documented migration plan.
- Review schema changes for downstream impact as part of your standard pull request process.
- Separate your internal persistence model from your external data contracts in code.

### Level 3. Optimized

- Run consumer-driven contract tests in your CI pipeline to verify that schema changes do not break downstream consumers.
- Participate in a cross-team data governance process that coordinates schema changes across domains.
- Your canonical models are discoverable in a shared catalog and are used as the reference by other teams.
- Schema compatibility is checked automatically at build time using tools integrated into your pipeline.
- You actively track and reduce data duplication across systems, with clear lineage from source of truth to downstream copies.
- Your team contributes to the organization's shared canonical data models and helps evolve them based on real-world needs.

---

## Minimum Standards

1. Every application must use a versioned schema migration tool for all database changes. No manual DDL in production.
2. Every application must document its primary data entities and their ownership (authoritative or derived) in a location accessible to other teams.
3. Any data published to other systems (via APIs, events, or files) must have a documented schema that includes field names, types, and required/optional status.
4. Schema changes to published data must be backward-compatible, or the team must provide a documented migration plan with a defined timeline.
5. Incoming data from external systems must be validated against an expected schema before being persisted or processed.
6. Database tables and columns must follow a consistent naming convention documented by the team.
7. No application may directly access another application's database. All cross-application data access must go through APIs or events.
8. Schema changes that affect data used in regulatory reporting must be reviewed with the relevant compliance or risk stakeholder before deployment.
9. Every published schema must include a version identifier that changes when the schema changes.
10. Data ownership for shared entities must be documented and agreed upon with consuming teams.

---

## Scoring Criteria

| Area | Level 1 | Level 2 | Level 3 |
|------|---------|---------|---------|
| Schema Management | Schema migration tool in use. Changes are versioned and repeatable. | Canonical schemas defined for all published data. Schema registry or versioned repo in place. | Automated compatibility checks in CI. Consumer-driven contract tests running. |
| Data Ownership | Primary entities documented. Authoritative vs. derived sources identified. | Ownership is enforced through technical controls. No direct cross-application database access. | Cross-team governance process in place. Ownership boundaries reviewed and updated regularly. |
| Data Validation | Basic input validation on key fields. | Schema-based validation at all application boundaries. Non-conforming data is rejected or quarantined. | Validation rules are shared and consistent across consuming applications. Data quality metrics tracked. |
| Schema Evolution | Changes are versioned. Team understands backward compatibility. | Backward-compatible evolution is standard practice. Breaking changes follow a documented migration plan. | Parallel version support is automated. Migration windows are tied to business cycles like reporting periods. |
| Documentation and Discovery | Basic data dictionary exists. Naming conventions defined. | Schemas are published in a shared registry or catalog. Other teams can discover and reference them. | Canonical models are the organizational standard. Team contributes to and evolves shared models. |
| Regulatory Alignment | Team knows which data feeds regulatory reports. | Schema changes to regulated data are reviewed with compliance before deployment. | Automated lineage tracking from source of truth through to regulatory output. |

---

## Anti-Patterns

- **The Shared Database.** Two or more applications read and write to the same database tables. This creates invisible coupling where a schema change by one team breaks another team without warning. It is one of the most common sources of data-related outages in legacy environments.

- **Schema by Convention.** There is no formal schema definition. Teams just "know" that the third column in the CSV is the account number. When someone adds a column in the middle, downstream parsing breaks silently and produces wrong numbers in reports.

- **The God Entity.** One massive table tries to serve every use case in the organization. It has 200 columns, half of which are nullable, and nobody can change it without a two-month impact assessment.

- **Copy-Paste Data Integration.** Teams copy data between systems by replicating tables or files with no transformation, no validation, and no documented lineage. When the data is wrong, nobody can trace it back to the source.

- **Cowboy Schema Changes.** A developer alters a production table directly without going through the migration tool. The change works in the moment but is not captured in version control, so the next environment refresh overwrites it and breaks things in a different way.

- **Pretending Everything Is Consistent.** A team builds logic that assumes data across multiple services is transactionally consistent when it is only eventually consistent. This leads to race conditions where a transaction posts before the account balance update has propagated, causing incorrect balance displays or even overdraft miscalculations.

- **Versioning Theater.** The schema has a version number, but it never changes even when the schema itself does. Consumers think they are getting v2 but the shape of the data has changed three times since v2 was published.

- **The Regulatory Surprise.** A team changes a field used in regulatory reporting without telling the compliance team. The change goes unnoticed until the quarterly filing comes back with a data quality exception from the regulator.

---

## Getting Started

1. **Inventory your data.** Spend an hour listing the key data entities your application manages. For each one, write down whether your application is the source of truth or whether it gets that data from somewhere else. This alone gives you a much clearer picture of your data landscape.

2. **Adopt a migration tool.** If you are not already using one, set up Flyway, Liquibase, or whatever fits your stack. Move all future schema changes into versioned migration scripts. This is a small effort with an outsized payoff.

3. **Document your published schemas.** If your application sends data to other systems through APIs, events, or files, write down the schema for each one. Field names, types, required or optional. Put it in your repo or on a wiki page where other teams can find it.

4. **Identify your downstream consumers.** Find out who depends on your data. Talk to those teams. Ask them what fields they use and what would break if you changed something. This conversation alone prevents most schema-related incidents.

5. **Flag one data ownership question.** Pick the most ambiguous data entity in your domain and start the conversation about who the authoritative source should be. You will not solve it this week, but getting it on the table is the first step.
