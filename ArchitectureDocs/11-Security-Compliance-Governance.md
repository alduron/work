# Security, Compliance and Governance by Design

## Purpose

Security, compliance, and governance are foundational constraints that shape how you design, build, and operate every application across the firm. Every design decision should account for who can access what, how you prove it, and how you demonstrate compliance. It is about building the right guardrails so teams can move fast with confidence that they are not creating risk.

---

## Universal Security Concerns

Every application across the firm, regardless of its regulatory profile or technology stack, must address these concerns. How each application addresses them will vary based on its specific context, the data it handles, and the regulations it falls under.

### 1. Authentication

Know who is accessing your system. Every user and every service that interacts with your application should be positively identified. Use the firm's centralized identity provider rather than maintaining your own user stores or password management. If your application has service-to-service communication, those services should authenticate each other as well, not just assume trust based on network location.

### 2. Authorization

Control what authenticated users and services can do. Access should follow the principle of least privilege, meaning every user and process gets only the access it needs to do its job and nothing more. Define roles based on business functions. Review access regularly and remove permissions that are no longer needed.

### 3. Sensitive Data Protection

Identify the sensitive data your application handles and protect it appropriately. This includes PII, financial records, account numbers, and any data subject to regulatory requirements. Sensitive data should be encrypted at rest and in transit. The specific encryption standards and approaches will depend on the regulations your application falls under, but the baseline expectation is that sensitive data is never stored or transmitted in plain text.

### 4. Audit Logging

Record what happens in your application. At a minimum, you should be able to answer these questions at any point in time: Who accessed this data? When did they access it? What changes were made to this system? Who approved those changes? Audit logs should be immutable, meaning they cannot be modified or deleted after the fact. What you log and how long you retain it will depend on your application's regulatory requirements.

### 5. Secret Management

Credentials, API keys, connection strings, certificates, and encryption keys must never be hardcoded in source code or committed to version control. Use a secrets management solution appropriate for your platform. If a secret is ever accidentally committed, treat it as compromised and rotate it immediately.

### 6. Dependency Security

Know what third-party code you are running. Your application almost certainly depends on open source libraries and vendor-provided components. Those dependencies can contain known vulnerabilities that attackers actively exploit. Scan your dependencies regularly and have a process for responding when a vulnerability is discovered in something you depend on.

### 7. Change Management

Every change to a production system should go through a defined process that includes review, approval, and the ability to roll back. This applies to code changes, infrastructure changes, configuration changes, and access changes. The rigor of the process will vary by application, but the principle is universal: no untracked changes to production.

### 8. Blast Radius Containment

Design your application so that a compromise in one area does not give an attacker access to everything. If one module or component is breached, the damage should be contained to that component. This means separate credentials for separate components, enforced boundaries between modules that handle different levels of sensitive data, and not sharing service accounts across applications.

### 9. Third-Party Risk

Every external integration is a potential attack surface. Vendor connections should use encrypted channels, validate inputs, and be monitored. Do not grant vendors broader access than they need. When a vendor's security posture changes, your risk changes with it.

### 10. Incident Response

Every application should have a plan for what happens when something goes wrong. Who gets notified? How do you contain the damage? How do you communicate with stakeholders? You do not need a 50-page document, but you do need a clear set of steps that your team can follow under pressure.

---

## How This Applies by Architecture Model

### Modular Monolith

- Use a single authentication mechanism for the application, but enforce authorization at the module level. Modules that handle different categories of sensitive data should not have unrestricted access to each other.
- Use a common audit logging approach across all modules so that logging is consistent and complete.
- Centralize secret management so no module maintains its own credentials or key store.

### Macrocomponents

- Each macrocomponent should authenticate its callers and enforce its own authorization rules. Do not assume that because a request made it past the gateway it is authorized for every operation.
- Each macrocomponent should have its own credentials. If one component is compromised, that should not give access to another component's data.
- Encrypt communication between macrocomponents. Even inside a private network, treat service-to-service traffic as potentially observable.
- Each macrocomponent should produce audit logs, and every request should carry a correlation ID so you can trace a user action across services.

### Microservices

- Do not assume that network location implies trust. Every service authenticates and authorizes every request.
- Use short-lived credentials where possible. Long-lived credentials across dozens of services are a serious risk.
- Each service produces its own audit events, but they should flow into a centralized store where they can be queried and correlated.

---

## Security in the Development Workflow

The traditional approach to security is a gate at the end. You build the application, a security team reviews it, finds problems, and sends it back. This creates bottlenecks, delays releases, and often results in superficial fixes because the team is under pressure to ship.

The better approach is to embed security checks into your normal development workflow. Scan your code for common vulnerabilities. Scan your dependencies for known issues. Check for accidentally committed secrets. The specific tools and approach will depend on your stack and your team's workflow, but the principle is the same: catch security problems early when they are cheap to fix, not late when they are expensive and urgent.

Think about security during design, not just during code review. When you are designing a new feature, ask yourself what data it touches, who should be able to access it, what happens if it is abused, and what audit trail it needs to produce. A few minutes of thought during design can prevent weeks of remediation later.

---

## Audit Readiness

In a regulated environment, being ready for an audit is not something you prepare for once a year. It is a continuous state. Your applications should be designed so that at any point in time, you can answer the fundamental questions about who accessed what, when, and why.

The foundation is immutable audit logging. Every significant action in your application should produce an audit event that cannot be modified or deleted. This includes user logins, access to sensitive data, configuration changes, permission grants, and administrative actions. The logs should capture who performed the action, what the action was, when it happened, what data was affected, and the outcome.

Beyond logging, audit readiness means having clear data lineage and change management trails. Data lineage lets you trace a piece of data from its source through all the transformations and systems it passes through until it reaches a report or customer-facing screen. Change management trails prove that every modification to production systems went through a defined approval process. When an examiner asks how a specific number ended up in a regulatory report, you should be able to walk them through the entire chain from source to output.

---

## Adoption Guidance

### Level 1. Foundational

- Identify the sensitive data your application handles and document where it is stored, processed, and transmitted.
- Authenticate users through the firm's centralized identity provider.
- Encrypt data in transit for all endpoints and database connections.
- Implement audit logging for user authentication events, failed access attempts, and administrative actions.
- Remove all hardcoded credentials from source code and move them to a secrets management solution.
- Conduct an initial threat model for your application and document the top risks.

### Level 2. Adopted

- Enforce role-based access control with roles aligned to business functions and the principle of least privilege.
- Implement automated security scanning in your CI/CD pipeline, with critical findings blocking deployment.
- Encrypt sensitive data at rest using standards approved for your application's regulatory context.
- Produce comprehensive audit logs for all data access, modifications, and system changes. Store logs in a tamper-evident system.
- Perform regular access reviews and remove stale permissions on a defined schedule.
- Integrate secret detection into your development workflow so secrets cannot be committed to version control.

### Level 3. Optimized

- Authenticate and authorize all internal service-to-service communication, not just external traffic.
- Automate compliance evidence collection so that audit artifacts are generated continuously, not assembled manually before an exam.
- Enforce security and compliance rules as automated checks that run alongside your tests and builds.
- Automate data classification so sensitive data elements are tagged and handling rules are enforced based on classification.
- Run regular penetration testing or security exercises against your application.
- Contribute security patterns, libraries, and templates back to the organization for other teams to use.

---

## Minimum Standards

These are the baseline security expectations that apply universally across all applications. Individual applications may have additional requirements based on the specific regulations they fall under.

1. All applications must authenticate users through the firm's centralized identity provider. Local user stores and application-managed passwords are not permitted for production systems.

2. Sensitive data must be encrypted at rest and in transit. The specific encryption standards depend on your application's regulatory requirements, but plain text storage or transmission of sensitive data is never acceptable.

3. All applications must produce immutable audit logs that capture authentication events, authorization decisions, access to sensitive data, and administrative actions. Retention periods are determined by the regulations applicable to your application.

4. No credentials, API keys, certificates, or encryption keys may be stored in source code, configuration files committed to version control, or container images.

5. All applications must implement role-based access control with roles defined according to the principle of least privilege.

6. All third-party dependencies must be scanned for known vulnerabilities. The team must have a defined process for responding to critical findings.

7. All changes to production systems must go through a documented change management process that includes approval, testing, and rollback procedures.

8. All applications must undergo a security assessment before initial production deployment and after any significant architectural change.

9. All third-party integrations must use encrypted channels, validate inputs, and limit vendor access to the minimum required scope.

10. All applications must have a documented incident response procedure that covers security events, data breaches, and unauthorized access.

---

## Scoring Criteria

| Area | Level 1 | Level 2 | Level 3 |
|------|---------|---------|---------|
| Authentication | Centralized authentication through the firm's identity provider for all users | Multi-factor authentication enforced for privileged access. Service accounts use managed identities | Service-to-service authentication for all internal communication. Context-aware authentication policies |
| Authorization | Role-based access control with documented roles | Least privilege enforced across all roles. Regular access reviews completed | Automated policy enforcement. Just-in-time access provisioning for privileged operations |
| Data Protection | Sensitive data identified and documented. Data encrypted in transit | All sensitive data encrypted at rest and in transit. Encryption applied at the field level where appropriate | Automated data classification and tagging. Encryption key rotation automated. Data masking in non-production environments |
| Audit Logging | Authentication events and failed access attempts logged | Comprehensive audit logs for all data access and changes. Centralized, tamper-evident log storage | Continuous compliance evidence generation. Automated audit reporting. Real-time alerting on suspicious access patterns |
| Vulnerability Management | Third-party dependencies inventoried. Initial security assessment completed | Automated security scanning in CI/CD pipeline. Critical findings block deployment | Comprehensive scanning automated across code, dependencies, and runtime. Regular penetration testing. Findings tracked to resolution |
| Change Management | All production changes go through a documented approval process | Automated change tracking through CI/CD pipelines. Segregation of duties enforced in the deployment process | Fully automated change evidence collection. Automated policy gates in pipeline. Continuous compliance monitoring |
| Third-Party Risk | Vendor integrations documented. Encrypted connections for all vendor traffic | Vendor security assessments completed. Vendor access scoped and monitored | Automated vendor risk monitoring. Continuous assessment of vendor security posture |
| Incident Response | Incident response procedure documented and team members trained | Incident response tested regularly. Automated alerting for security events. Runbooks for common scenarios | Automated incident detection and initial response. Regular security exercises. Post-incident reviews feed back into architecture improvements |

---

## Anti-Patterns

- **"We'll add security later."** A team builds a new system focused on functionality and performance, planning to "harden it" before go-live. When go-live pressure hits, security work gets deferred. The system launches with sensitive data stored in plain text, no audit logging, and shared credentials. Retrofitting security after the fact takes three times longer than building it in from the start.

- **"The firewall protects us."** A team assumes that because their application runs inside the firm's private network, they do not need to encrypt internal traffic or authenticate service-to-service calls. An attacker who compromises one internal system can now move laterally across every service without any additional authentication barriers.

- **"One service account to rule them all."** Multiple applications share a single privileged service account to access a shared database. When a security event occurs, there is no way to determine which application performed the suspicious query. Audit logs are useless because every access looks the same.

- **"Logging is someone else's problem."** A development team builds a system but does not implement audit logging because "the infrastructure team handles logging." The infrastructure team captures web server access logs but has no visibility into application-level data access. When an auditor asks who accessed specific sensitive data, nobody can answer.

- **"Copy the production database to dev."** A team copies production data, including real PII and sensitive records, into their development environment to debug an issue. The dev environment has relaxed access controls, no encryption, and is accessible to contractors. This violates the firm's data handling policies and potentially multiple regulations.

- **"We trust the vendor."** A team integrates with a third-party provider and grants the vendor broad API access to sensitive data because "they passed our vendor assessment." The team does not implement input validation, rate limiting, or monitoring on the vendor connection. When the vendor's system is compromised, the attacker has direct access to data through the trusted API.

- **"Compliance is a once-a-year event."** A team scrambles before the annual audit to generate evidence, update access lists, and document controls. For the rest of the year, access reviews do not happen, security findings pile up unresolved, and nobody checks whether controls are still working. This creates a cycle of reactive compliance that consumes enormous effort and still produces findings.

- **"The developer is also the admin."** Developers have production database access and can deploy code directly to production without approval. There is no segregation of duties. A single person can write code, deploy it, and modify data without any independent check.

---

## Getting Started

1. **Map your sensitive data.** Walk through your application and identify every place where sensitive data is stored, processed, logged, or transmitted. This includes databases, message queues, log files, cache layers, and API responses. You cannot protect what you do not know about.

2. **Eliminate hardcoded secrets.** Search your code repositories for credentials, API keys, connection strings, and certificates. Move them to a secrets management solution. Set up secret detection in your workflow so new secrets cannot be committed going forward.

3. **Turn on audit logging for the critical paths.** You do not need to log everything on day one. Start with user authentication, access to sensitive data, and administrative actions. Make sure your logs capture who, what, when, and the outcome. Write them to a store where they cannot be tampered with.

4. **Run your first security scan.** Add automated security scanning to your CI/CD pipeline. Do not try to fix every finding at once. Triage the results, fix the critical items, and create backlog items for the rest. The important thing is that the scanning is running and visible.

5. **Review your access controls.** Check who has access to your production systems, databases, and deployment pipelines. Remove any access that is not actively needed. Set a regular schedule to review access going forward. This one step alone will address a significant portion of audit findings.

---

*Security expectations within the firm are not optional. Building security, compliance, and governance into your architecture from the start is the cost of operating here. The specific controls each application must implement will depend on the data it handles and the regulations it falls under, but the concerns outlined in this document apply to everyone.*
