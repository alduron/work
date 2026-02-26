# Architecture Modernization Tenets

## What This Is

We are modernizing how we build and maintain custom applications across ITSO. This guide defines a set of patterns and principles that every application team should be working toward.

These are not rigid mandates. They are practical guidelines designed to meet teams where they are today and give them a clear path forward. Some teams are just getting started. Others are well along. That is fine. The goal is progress, not perfection.

Every application will be assessed against these tenets. Teams adopt patterns at their own pace, and we score applications to track maturity over time. This helps leadership measure progress, prioritize investment, and make informed decisions about each application.

---

## The Tenets

### Design and Structure

**[Domain-Driven Architecture](./01-Domain-Driven-Architecture.md)**
Organize your application around business domains, not technical layers. Define clear boundaries between contexts so teams can own their domain end to end without stepping on each other.

**[Data Modeling and Schema Discipline](./02-Data-Modeling-Schema-Discipline.md)**
Establish canonical data models, version your schemas, and make data ownership explicit. Know which system is the source of truth for every piece of data.

**[Modular Code and Test Coverage](./05-Modular-Code-and-Test-Coverage.md)**
Write code with clean separation of concerns so it can be tested, understood, and changed without fear. Business logic should be independent of frameworks, databases, and external services.

### Integration

**[Event-Driven Data Flow](./03-Event-Driven-Data-Flow.md)**
Use asynchronous events to decouple systems from each other. Replace brittle point-to-point integrations and unnecessary batch processes with event-based communication.

**[API-First Contracts](./04-API-First-Contracts.md)**
Design your APIs before you build them. Define contracts, version them, and make sure producers and consumers agree on what the interface looks like before anyone writes code.

### Data Freshness and Performance

**[Data Freshness and Access Patterns](./06-Data-Freshness-and-Access-Patterns.md)**
Know how fresh your data is and how fresh it needs to be. Replace stale batch feeds with near-real-time patterns where the business requires it. Separate read paths from write paths and serve data in the shape consumers actually need.

### Operations

**[Observability-Driven Systems](./07-Observability-Driven-Systems.md)**
Instrument your applications so you can understand what is happening in production. Structured logs, metrics, and distributed traces should be built in from the start, not added after an outage.

**[CI/CD and Independent Deployability](./08-CICD-and-Independent-Deployability.md)**
Deploy your application on its own, at any time, without coordinating with other teams. Automate your pipeline, use feature flags to separate deployment from release, and eliminate manual steps.

### Infrastructure

**[Cloud-Ready Scalability and Resilience](./09-Cloud-Ready-Scalability-Resilience.md)**
Build applications that can scale horizontally, recover from failure, and run on infrastructure defined in code.

### Cross-Cutting

**[AI-Ready Architecture](./10-AI-Ready-Architecture.md)**
Make your application's data accessible for AI and ML use cases. Even if you are not building AI features today, the way you structure data and events now will determine how easily you can integrate AI later.

**[Security, Compliance and Governance by Design](./11-Security-Compliance-Governance.md)**
Build security and compliance in from day one. Encrypt sensitive data, enforce least privilege, maintain audit trails, and automate compliance checks in your pipeline. Do not bolt it on at the end.

---

## Maturity Model

Each tenet defines expectations at three maturity levels. Applications are scored based on the level they currently meet.

### Level 1. Foundational
You understand the pattern and have taken the first steps. Key structural decisions have been made even if the implementation is not complete yet.

- The team understands the pattern and has documented how it applies
- Basic structural alignment is in place
- Manual processes may still exist
- Technical debt is identified and tracked in the backlog

### Level 2. Adopted
The pattern is actively practiced and part of how the team works every day. Automation supports the pattern and the team can show consistent results.

- New work consistently follows the pattern
- Key workflows are automated
- Legacy code is being migrated incrementally
- The team collects and reviews metrics

### Level 3. Optimized
The pattern is fully embedded and continuously improving. The team contributes back to the organization and serves as a reference for others.

- The pattern is fully implemented across the entire application
- There is evidence of continuous improvement
- The team mentors other teams on this pattern
- The application is considered an exemplar

---

## Scoring Framework

### How Scoring Works

1. **Self-Assessment.** Application teams score themselves against each tenet using the maturity rubric
3. **Evidence-Based.** Scores must be backed by real artifacts like code, configs, pipelines, or dashboards
4. **Regular Cadence.** Scores are refreshed on a regular cadence to track progress over time

### Score Scale

Each tenet is scored from 0 to 3.

| Score | What It Means |
|-------|---------------|
| 0 | **Not Started.** No awareness or adoption of the pattern |
| 1 | **Foundational.** Basic adoption and structural alignment |
| 2 | **Adopted.** Consistent practice with automation in place |
| 3 | **Optimized.** Fully embedded with continuous improvement |

### Composite Score

The **Application Modernization Score** is a weighted average across all 11 tenets. Weights can be adjusted based on what the organization cares about most right now.

| Category | Default Weight |
|----------|---------------|
| Design and Structure (Tenets 1, 2, 5) | 1.0x |
| Integration (Tenets 3, 4) | 1.0x |
| Data Freshness and Performance (Tenet 6) | 1.0x |
| Operations (Tenets 7, 8) | 1.2x |
| Infrastructure (Tenet 9) | 1.0x |
| Cross-Cutting (Tenets 10, 11) | 1.0x |

### Score Bands

| Band | Score Range | What It Tells You |
|------|-------------|-------------------|
| Red | 0.0 to 0.9 | Modernization has not started or is severely behind |
| Orange | 1.0 to 1.4 | Foundational work is underway but significant gaps remain |
| Yellow | 1.5 to 1.9 | Solid foundation with adoption actively in progress |
| Green | 2.0 to 2.4 | Patterns are adopted and the team is continuously improving |
| Blue | 2.5 to 3.0 | Exemplary. This team is a reference implementation for others |

---

## How to Use This Guide

### If You Are a Developer or Development Team
1. Read this overview to understand the tenets and the maturity model
2. Review each tenet page that is relevant to your current work
3. Assess your application against the minimum standards
4. Identify gaps and add them to your backlog with priority
5. Adopt incrementally. Focus on reaching Level 1 across all tenets before pushing any single tenet to Level 3

### If You Are a Tech Lead or Architect
1. Use the scoring framework to assess your portfolio
2. Look for patterns in the gaps across your applications
3. Build shared enablers like libraries, templates, and pipeline configurations that make it easier for teams to adopt
4. Use the tenet rubrics as the basis for architecture reviews

### If You Are in Leadership
1. Track scores at the portfolio level over time
2. Use score bands and strategic priorities to guide investment decisions
3. Recognize teams that reach Exemplary status
4. Use scores to inform build, buy, or retire decisions

---

## Adoption Journey

These tenets define where each application needs to get to, not when it needs to get there. Each of the 15 applications will chart its own path based on its current state, its business criticality, and the priorities of its team. The maturity levels provide a shared definition of progress, and the scoring framework gives teams a way to measure where they stand.

### Suggested Progression

1. **Assess.** Every application should be scored against the tenets to establish a baseline. You cannot improve what you have not measured.
2. **Secure the foundation.** Security, Compliance and Governance (Tenet 11) and Observability (Tenet 7) are foundational. Teams should prioritize reaching Level 1 in these areas before moving on to other tenets.
3. **Broaden adoption.** Work toward Level 1 across all tenets. Standardize CI/CD pipelines (Tenet 8) and establish the shared API catalog (Tenet 4). These enablers make everything else easier.
4. **Deepen maturity.** Push high-priority areas toward Level 2 and Level 3. Publish reference implementations, adopt event-driven integration patterns, and introduce AI-Ready capabilities where they add value.
5. **Sustain and evolve.** Architecture is not a destination. Continuously reassess scores, share knowledge through the community of practice, and evolve the tenets themselves as the technology landscape changes.

---

*This is a living document. The tenets, scoring weights, and maturity definitions will evolve as we learn. Feedback from development teams is essential. Submit suggestions through the Architecture Community of Practice.*
