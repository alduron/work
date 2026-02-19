# Security, Compliance and Governance by Design

## Purpose

Security, compliance, and governance are foundational constraints that shape how you design, build, and operate every application across the firm. Every design decision should account for who can access what, how you prove it, and how you demonstrate compliance to regulators. This is not about slowing teams down. It is about building the right guardrails so teams can move fast with confidence that they are not creating risk.

---

## Key Principles

- Security and threat modeling happen during design, not after build
- Every user, service, and process starts with zero access and gets only what it needs
- PII, account numbers, SSNs, and financial data are never stored or transmitted in plain text
- Every access to sensitive data, every config change, and every deployment produces an immutable audit record
- Compliance checks are automated in the CI/CD pipeline. Violations fail the build
- A breach in one component does not give access to other components (segmented blast radius)
- All third-party integrations are treated as untrusted. Inputs are validated, contracts are enforced
- Secrets are never hardcoded in source code or config files
- Segregation of duties is enforced for production access and deployments

---

## How This Applies by Architecture Model

### Modular Monolith

- **Centralized authentication, modular authorization.** Use a single authentication mechanism for the application, but enforce authorization rules at the module boundary. The Lending module should not be able to read data from the BSA/AML module just because they share a process.
- **Module-level access control lists.** Define which roles and permissions are valid within each module. Even though modules share a runtime, treat cross-module data access as a controlled operation that requires explicit permission.
- **Shared audit logging infrastructure.** Use a common audit logging library across all modules to ensure consistent formatting, immutable storage, and complete coverage. Every module writes to the same audit trail with a standard schema.
- **Centralized secret management.** Store all database credentials, API keys, and encryption keys in a single secrets manager. No module should have hardcoded credentials or maintain its own key store.

### Macrocomponents

- **Service-level authentication and authorization.** Each macrocomponent should authenticate callers and enforce its own authorization rules. Do not assume that because a request made it through the API gateway it is authorized for every operation.
- **Independent credential stores per service.** Each macrocomponent should have its own database credentials and service accounts. If the Payment Processing component is compromised, the attacker should not automatically gain access to the Customer Profile component's data store.
- **Encrypted inter-service communication.** All communication between macrocomponents should use mTLS or equivalent encryption. Even inside a private network, treat service-to-service traffic as potentially observable.
- **Per-component audit trails with correlation.** Each macrocomponent maintains its own audit log, but every request carries a correlation ID so you can trace a customer action across all the services it touches.
- **Centralized policy management.** Use a shared policy engine (like OPA or a similar tool) so that authorization rules are consistent and auditable across all macrocomponents. Policy changes should go through version control, not manual configuration.

### Microservices

- **Zero trust networking.** Never assume that network location implies trust. Every service must authenticate and authorize every request, regardless of whether the caller is inside or outside the network perimeter.
- **Service mesh for security enforcement.** Use a service mesh to handle mTLS, rate limiting, and access policies between services. This gets security out of application code and into infrastructure where it can be managed consistently.
- **API gateway as the security perimeter.** Your API gateway should handle authentication, token validation, rate limiting, and coarse-grained authorization for all external traffic. Fine-grained authorization still happens at the service level.
- **Short-lived credentials and automatic rotation.** In a microservices environment with dozens or hundreds of services, long-lived credentials are a serious risk. Use short-lived tokens, automatic secret rotation, and just-in-time credential provisioning.
- **Decentralized audit with centralized aggregation.** Each service produces its own audit events, but they flow into a centralized, immutable audit store where they can be queried, correlated, and reported on for regulatory purposes.

---

## Regulatory Landscape

Applications across the firm operate under a dense web of regulations, and each one has real implications for how you design your systems. SOX (Sarbanes-Oxley) requires that financial reporting systems have strong internal controls, segregation of duties, and complete change management trails. If your application produces data that feeds into financial reports, you need to prove that the data has not been tampered with, that access is controlled, and that every change to the system is tracked and approved. This means your deployment pipelines, database access controls, and configuration management all become audit targets.

PCI-DSS affects any application that processes, stores, or transmits cardholder data. The key architectural implication is scoping. You want to minimize the number of systems that touch cardholder data, because every system in scope must meet all PCI-DSS requirements. This drives design decisions like tokenization (replacing card numbers with tokens as early as possible), network segmentation (isolating cardholder data environments), and strict access controls on any system that handles raw card data. Getting PCI scoping wrong is one of the most expensive architectural mistakes you can make.

GLBA (Gramm-Leach-Bliley Act) requires financial institutions to protect the security and confidentiality of nonpublic personal information. This is broader than PCI, covering all NPI, not just card data. Your applications need to demonstrate that sensitive data is protected from unauthorized access, that you have an information security program, and that you assess risks from third-party service providers. OCC (Office of the Comptroller of the Currency) guidelines reinforce these requirements with specific expectations about risk management, vendor oversight, and technology governance.

FFIEC (Federal Financial Institutions Examination Council) provides examination handbooks that examiners use when they review your technology operations. Their guidance covers information security, business continuity, IT audit, and outsourced technology services. While FFIEC does not create legally binding rules, their examination procedures are what regulators actually use when they walk through your door. Building your applications with FFIEC examination criteria in mind means fewer surprises during regulatory exams. This includes things like access management reviews, incident response procedures, and evidence that you test your controls regularly.

---

## Security as Code

The traditional approach to security in software development is a gate at the end. You build the application, then a security team reviews it, finds problems, and sends it back. This creates bottlenecks, delays releases, and often results in superficial fixes because the team is under pressure to ship. The better approach is to embed security checks directly into your CI/CD pipeline so that every commit, every build, and every deployment is automatically validated against your security standards.

Start with four categories of automated checks. SAST (Static Application Security Testing) scans your source code for vulnerabilities like SQL injection, cross-site scripting, and insecure deserialization. Run this on every pull request so developers get feedback before code is merged. DAST (Dynamic Application Security Testing) tests your running application for vulnerabilities by sending it malicious inputs and observing the responses. Run this against your staging environment as part of your release pipeline. Dependency scanning checks your third-party libraries against known vulnerability databases (CVEs) and flags any components with known security issues. In a banking environment, this is critical because a vulnerable logging library or XML parser can become a major incident. Secret detection scans your code, configuration files, and commit history for accidentally committed credentials, API keys, or certificates. This should run pre-commit if possible so secrets never make it into version control.

The goal is to make these checks fast, reliable, and non-negotiable. If a SAST scan finds a critical vulnerability, the build should fail. If a dependency has a known CVE with a severity above your threshold, the deployment should not proceed. This is not about punishing developers. It is about creating a safety net that catches problems early when they are cheap to fix. Teams should be able to see their security scan results in the same dashboard where they see their test results and code coverage. Security becomes part of the normal development workflow, not a separate process that happens somewhere else.

---

## Audit Readiness

In a regulated environment, being ready for an audit is not something you prepare for once a year. It is a continuous state. Your applications should be designed so that at any point in time, you can answer fundamental questions. Who accessed this data? When did they access it? What changes were made to this system? Who approved those changes? Can you prove that access controls are working as intended?

The foundation is immutable audit logging. Every significant action in your application should produce an audit event that cannot be modified or deleted. This includes user logins, data access (especially PII and financial data), configuration changes, permission grants, and administrative actions. These logs should be written to a tamper-evident store, whether that is an append-only database, a write-once storage bucket, or a dedicated audit platform. The logs must include who performed the action, what the action was, when it happened, what data was affected, and the outcome (success or failure). For SOX compliance specifically, you also need to capture the approval chain for changes to financial reporting systems.

Beyond logging, audit readiness means having clear data lineage and change management trails. Data lineage lets you trace a piece of data from its source through all the transformations and systems it passes through until it reaches a report or customer-facing screen. Change management trails prove that every modification to production systems went through a defined approval process. This includes code changes (tracked in version control), infrastructure changes (tracked through IaC pipelines), configuration changes (tracked in a configuration management system), and access changes (tracked in your identity provider). When an examiner asks how a specific number ended up in a regulatory report, you should be able to walk them through the entire chain from source to output.

---

## Adoption Guidance

### Level 1. Foundational

- Identify all PII, cardholder data, and other sensitive data elements in your application and document where they are stored, processed, and transmitted.
- Implement centralized authentication using the firm's identity provider. No application should maintain its own user/password store.
- Enable TLS for all external-facing endpoints and all database connections.
- Implement basic audit logging for user authentication events, failed access attempts, and administrative actions.
- Remove all hardcoded credentials from source code and move them to a secrets manager or environment-level configuration.
- Conduct an initial threat model for your application and document the top risks.

### Level 2. Adopted

- Enforce role-based access control (RBAC) at the application level with roles aligned to business functions and the principle of least privilege.
- Implement automated security scanning (SAST and dependency scanning) in your CI/CD pipeline, with builds failing on critical findings.
- Encrypt all sensitive data at rest using approved encryption standards. Use field-level encryption for PII where appropriate.
- Produce comprehensive audit logs for all data access, modifications, and system changes. Store logs in a tamper-evident, centralized system.
- Perform regular access reviews and remove stale permissions on a defined schedule (at minimum quarterly).
- Integrate secret detection into your pre-commit hooks or pull request checks.

### Level 3. Optimized

- Implement zero trust patterns with service-to-service authentication and per-request authorization for all internal communication.
- Automate compliance evidence collection so that audit artifacts are generated continuously, not assembled manually before an exam.
- Use policy-as-code to enforce security and compliance rules across all environments, with policy changes versioned and reviewed like application code.
- Implement automated data classification that tags sensitive data elements and enforces handling rules based on classification.
- Run regular automated penetration testing and red team exercises against your application.
- Contribute security patterns, libraries, and pipeline templates back to the organization for other teams to use.

---

## Minimum Standards

1. All applications must authenticate users through the firm's centralized identity provider. Local user stores and application-managed passwords are not permitted for production systems.

2. All sensitive data (PII, account numbers, SSNs, cardholder data, financial records) must be encrypted at rest using AES-256 or equivalent approved encryption.

3. All data in transit must be encrypted using TLS 1.2 or higher. Unencrypted HTTP endpoints are not permitted, even for internal services.

4. All applications must produce immutable audit logs that capture authentication events, authorization decisions, access to sensitive data, and administrative actions. Logs must be retained for a minimum of seven years to meet regulatory requirements.

5. No credentials, API keys, certificates, or encryption keys may be stored in source code, configuration files committed to version control, or container images. All secrets must be managed through an approved secrets management solution.

6. All applications must implement role-based access control with roles defined according to the principle of least privilege. Access must be reviewed and recertified at least quarterly.

7. All third-party dependencies must be scanned for known vulnerabilities before deployment. Dependencies with critical or high severity CVEs must be patched or mitigated within the timeframes defined by the firm's vulnerability management policy.

8. All applications that process, store, or transmit cardholder data must comply with PCI-DSS scoping requirements. Cardholder data must be tokenized at the earliest possible point, and the cardholder data environment must be segmented from other systems.

9. All changes to production systems must go through a documented change management process that includes approval, testing, and rollback procedures. Emergency changes must be documented and approved retroactively within 24 hours.

10. All applications must undergo a security assessment (threat model and code review) before initial production deployment and after any significant architectural change.

11. All third-party vendor integrations must be assessed for security risk. Vendor connections must use encrypted channels, validated certificates, and monitored endpoints. Vendor access must be limited to the minimum required scope.

12. All applications must have a documented incident response procedure that covers security events, data breaches, and unauthorized access. The procedure must be tested at least annually.

---

## Scoring Criteria

| Area | Level 1 | Level 2 | Level 3 |
|------|---------|---------|---------|
| Authentication | Centralized authentication through the firm's identity provider for all users | Multi-factor authentication enforced for all privileged access. Service accounts use managed identities | Adaptive authentication with context-aware policies. Certificate-based or token-based auth for all service-to-service calls |
| Authorization | Basic role-based access control with documented roles | Fine-grained RBAC with least privilege enforced. Quarterly access reviews completed | Policy-as-code authorization with automated enforcement. Just-in-time access provisioning for privileged operations |
| Data Protection | Sensitive data identified and documented. TLS enabled for external endpoints | All sensitive data encrypted at rest and in transit. Field-level encryption for PII. Tokenization for cardholder data | Automated data classification and tagging. Encryption key rotation automated. Data masking in non-production environments |
| Audit Logging | Authentication events and failed access attempts logged. Logs retained per policy | Comprehensive audit logs for all data access and changes. Centralized, tamper-evident log storage | Continuous compliance evidence generation. Automated audit report creation. Real-time alerting on suspicious access patterns |
| Vulnerability Management | Third-party dependencies inventoried. Initial security assessment completed | Automated SAST and dependency scanning in CI/CD. Critical findings block deployment | Full SAST, DAST, dependency scanning, and secret detection automated. Regular penetration testing. Findings tracked to resolution |
| Change Management | All production changes go through documented approval process | Automated change tracking through CI/CD pipelines. Segregation of duties enforced in deployment process | Fully automated change evidence collection. Policy-as-code gates in pipeline. Continuous compliance monitoring |
| Third-Party Risk | Vendor integrations documented. Encrypted connections for all vendor traffic | Vendor security assessments completed. Vendor access scoped and monitored | Automated vendor risk monitoring. Continuous assessment of vendor security posture. Contract-enforced security requirements |
| Incident Response | Incident response procedure documented and team members trained | Incident response tested annually. Automated alerting for security events. Runbooks for common scenarios | Automated incident detection and initial response. Regular red team exercises. Post-incident reviews feed back into architecture improvements |

---

## Anti-Patterns

- **"We'll add security later."** A team builds a new system focused on functionality and performance, planning to "harden it" before go-live. When go-live pressure hits, security work gets deferred. The system launches with PII stored in plain text, no audit logging, and shared database credentials. Retrofitting security after the fact takes three times longer than building it in from the start.

- **"The firewall protects us."** A team assumes that because their application runs inside the firm's private network, they do not need to encrypt internal traffic or authenticate service-to-service calls. An attacker who compromises one internal system can now move laterally across every service without any additional authentication barriers.

- **"One service account to rule them all."** Multiple applications share a single privileged service account to access a shared database. When a security event occurs, there is no way to determine which application performed the suspicious query. Audit logs are useless because every access looks the same.

- **"Logging is someone else's problem."** A development team builds a system but does not implement audit logging because "the infrastructure team handles logging." The infrastructure team captures web server access logs but has no visibility into application-level data access. When an auditor asks who accessed specific sensitive data, nobody can answer.

- **"Copy the production database to dev."** A team copies production data (including real PII and sensitive records) into their development environment to debug an issue. The dev environment has relaxed access controls, no encryption, and is accessible to contractors. This violates GLBA, PCI-DSS, and the firm's own data handling policies.

- **"We trust the vendor."** A team integrates with a third-party provider and grants the vendor broad API access to sensitive data because "they passed our vendor assessment." The team does not implement input validation, rate limiting, or monitoring on the vendor connection. When the vendor's system is compromised, the attacker has direct access to data through the trusted API.

- **"Compliance is a once-a-year event."** A team scrambles before the annual audit to generate evidence, update access lists, and document controls. For the rest of the year, access reviews do not happen, security findings pile up unresolved, and nobody checks whether controls are still working. This creates a cycle of reactive compliance that consumes enormous effort and still produces findings.

- **"The developer is also the admin."** Developers have production database access and can deploy code directly to production without approval. There is no segregation of duties. A single person can write code, deploy it, and modify data without any independent check. This is a direct SOX violation for any system involved in financial reporting.

---

## Getting Started

1. **Map your sensitive data.** Walk through your application and identify every place where PII, cardholder data, or financial records are stored, processed, logged, or transmitted. This includes databases, message queues, log files, cache layers, and API responses. You cannot protect what you do not know about.

2. **Eliminate hardcoded secrets.** Search your code repositories for credentials, API keys, connection strings, and certificates. Move them all to a secrets manager. Set up secret detection in your CI pipeline so new secrets cannot be committed going forward.

3. **Turn on audit logging for the critical paths.** You do not need to log everything on day one. Start with user authentication, access to sensitive data, and administrative actions. Make sure your logs capture who, what, when, and the outcome. Write them to a store where they cannot be tampered with.

4. **Run your first security scan.** Add SAST and dependency scanning to your CI/CD pipeline. Do not try to fix every finding at once. Triage the results, fix the critical items, and create backlog items for the rest. The important thing is that the scanning is running and visible.

5. **Review your access controls.** Check who has access to your production systems, databases, and deployment pipelines. Remove any access that is not actively needed. Set a calendar reminder to review access quarterly. This one step alone will address a significant portion of audit findings.

---

*Regulatory expectations are not suggestions. They carry real consequences including enforcement actions, fines, consent orders, and reputational damage. Building security, compliance, and governance into your architecture from the start is not optional. It is the cost of operating within the firm.*
