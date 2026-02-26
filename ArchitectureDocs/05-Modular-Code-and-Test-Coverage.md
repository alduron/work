# Modular Code and Test Coverage

## Purpose

Modular, testable code is the foundation of sustainable delivery. When your code is organized into focused modules with clear boundaries, and when your business logic can be tested in isolation, you ship faster because changes are contained, you onboard new developers faster because the code is readable, and you catch bugs before they reach production. This tenet is about building code that your team can change with confidence, today and five years from now.

## Key Principles

- Business logic does not depend on frameworks, databases, or external services
- Each module does one coherent thing and can be explained in a single sentence
- Side effects (database calls, API calls, file I/O) happen at the edges, not inside business logic
- Dependencies point inward toward business logic, never outward from it
- No circular dependencies between modules
- Code depends on abstractions (interfaces), not concrete implementations
- Any business rule can be tested without a running database or external service
- Composition over inheritance
- Every module has a clear public interface and hides its internals

## How This Applies by Architecture Model

### Modular Monolith

- Define explicit module boundaries. Even though everything deploys together, each module should have a public API (a set of interfaces or service contracts) and keep its internals private. One module should not reach into another module's database tables.
- Use a shared kernel carefully. Common types like `Money`, `EntityId`, or `DateRange` can live in a shared kernel. But keep it small. If the shared kernel grows into a dumping ground for everything, you have lost your module boundaries.
- Enforce boundaries with project structure or build rules. Use separate projects, packages, or build modules to make it physically difficult to violate module boundaries. A compile error is better than a code review comment.
- Communicate between modules through defined interfaces. Module-to-module calls should go through service interfaces, not by directly instantiating another module's internal classes. This gives you the option to extract a module into a separate service later without rewriting the callers.

### Macrocomponents

- Structure each macrocomponent internally as if it were a modular monolith. Just because you split into a few services does not mean you can skip internal code organization. Each macrocomponent still needs clean layers and testable business logic.
- Isolate shared libraries and keep them stable. If your macrocomponents share a common library for things like shared types or utility calculations, version it properly and treat changes to it like changes to a public API.
- Test business logic in isolation within each component. Each macrocomponent should have a thorough unit test suite that runs in milliseconds without hitting any external service. Integration tests that cross component boundaries are a separate concern.
- Use anti-corruption layers at component boundaries. When one macrocomponent calls another, translate the response into your own domain model. Do not let another component's data structures leak into your business logic.

### Microservices

- Keep services small enough that internal modularity is almost trivial. If a microservice is so large that it needs complex internal module boundaries, it might be doing too much. A well-scoped microservice often has a single domain module at its core.
- Invest heavily in contract testing. With many services communicating over the network, you need confidence that changes to one service do not break its consumers. Consumer-driven contract tests are essential.
- Standardize service templates and scaffolding. When teams spin up new microservices frequently, a consistent internal structure (where business logic lives, where infrastructure code goes, how tests are organized) saves enormous time and reduces cognitive load.
- Do not share code through shared libraries unless absolutely necessary. In a microservices world, shared libraries create hidden coupling. Prefer duplicating small amounts of code over creating a shared library that ties services together at deploy time.

## Test Strategy

Your test strategy should follow the test pyramid. The base of the pyramid is unit tests, fast and focused tests that exercise your business logic in isolation. These should be the majority of your tests. A well-tested calculation engine should have dozens of unit tests covering normal cases, edge cases, rounding rules, and regulatory requirements. These tests should run in milliseconds with no external dependencies at all. If your unit tests need a database connection, something is wrong with your code structure, not your test setup.

The middle of the pyramid is integration tests. These verify that your code works correctly with real infrastructure like databases, message brokers, and external APIs. Use integration tests to confirm that your repository implementations actually persist and retrieve data correctly, that your message handlers deserialize events properly, and that your API endpoints return the right HTTP status codes. These tests are slower and more expensive to maintain, so be intentional about what you cover. You do not need an integration test for every business rule. That is what unit tests are for.

At the top of the pyramid, use end-to-end tests sparingly. These tests exercise your entire system from the outside and are valuable for verifying critical user journeys. But they are slow, brittle, and expensive to maintain. A few well-chosen end-to-end tests that cover your most important flows are worth more than hundreds of flaky ones that nobody trusts. If your end-to-end tests fail randomly, teams will start ignoring them, and then you have no safety net at all.

For APIs, add contract tests. These sit between integration and end-to-end tests and verify that your API produces responses that match what your consumers expect. Tools like Pact or Spring Cloud Contract make this practical. Across the firm where dozens of systems consume your APIs, contract tests are the best way to catch breaking changes before they reach production.

## Keep Business Logic Separate from Infrastructure

The goal is straightforward. Your business logic, meaning the calculations, validations, and rules that define what your application actually does, should not directly depend on your database, your HTTP framework, or any external service. It should be plain code that takes inputs and produces outputs.

When business logic is tangled up with database queries and API calls, the only way to test it is to stand up the entire environment. When it is separated, you can test your rules with simple function calls and predictable inputs. That is the difference between a test suite that runs in seconds and one that takes 20 minutes and fails randomly.

How you organize your folders and packages to achieve this is up to your team. Every framework and language has its own conventions. The principle is what matters: business logic should not import your database library, your HTTP framework, or your messaging SDK. The code that talks to those systems should live in a separate place and call into the business logic, not the other way around.

## Adoption Guidance

### Level 1. Foundational

- Identify and document the major modules or functional areas within your application, even if the code does not currently reflect those boundaries.
- Ensure all new code has unit tests. You do not have to retrofit tests onto legacy code yet, but stop making the problem worse.
- Set up a test runner in your CI pipeline so that tests run on every build. If tests fail, the build fails.
- Introduce dependency injection in new code so that classes receive their dependencies through constructors rather than creating them internally.
- Pick one critical piece of business logic and refactor it so it can be tested without a database or external service.
- Document your target code structure so the team has a shared picture of where things should go.

### Level 2. Adopted

- All new features are built with clean separation between business logic, infrastructure, and presentation.
- Unit test coverage for business logic is above 70% and trending upward.
- Integration tests cover your main data access paths and API endpoints.
- Legacy code is being incrementally refactored toward the target structure. You have a plan and are making visible progress.
- The team uses code review checklists that include testability and modularity criteria.
- Contract tests exist for your most important API consumers.

### Level 3. Optimized

- Business logic is fully separated from infrastructure across the entire codebase.
- Unit test coverage for domain logic exceeds 90%.
- The test suite runs fast enough that developers run it locally before every commit and it completes in CI within minutes.
- The team actively refactors to improve modularity and testability as part of regular development, not as a separate initiative.
- Architecture fitness functions or static analysis rules enforce module boundaries and dependency direction automatically.
- The team shares patterns, libraries, or templates with other teams and contributes to the organization's testing and architecture standards.

## Minimum Standards

1. All new business logic must have unit tests that run without external dependencies (no database, no network, no file system).
2. The CI/CD pipeline must run the full test suite on every pull request, and a test failure must block the merge.
3. Business logic classes must not directly reference database frameworks, HTTP clients, or messaging libraries.
4. Every module or functional area must have a documented public interface. Internal implementation details must not be accessible to other modules.
5. Dependency injection must be used for all service dependencies. No static service locators, no hidden singletons, no `new`-ing up infrastructure classes inside business logic.
6. Unit test coverage for business logic must be measured and reported. The team must have a target and a plan to reach it.
7. No single class may exceed 500 lines of code without a documented exception approved by the team's tech lead.
8. Integration tests must exist for all database repository implementations and external API client wrappers.
9. Circular dependencies between modules are not allowed. Build tooling or static analysis must enforce this.

## Scoring Criteria

| Area | Level 1 | Level 2 | Level 3 |
|------|---------|---------|---------|
| Code structure | Major modules are identified and documented. New code follows the target structure. | Clean separation of business logic, infrastructure, and presentation in all new code and most existing code. | Full clean architecture across the entire codebase. Fitness functions enforce boundaries. |
| Unit testing | All new business logic has unit tests. A test runner is integrated into CI. | Unit test coverage for business logic exceeds 70%. Tests run fast and are reliable. | Unit test coverage for domain logic exceeds 90%. Developers run tests locally before every commit. |
| Integration testing | At least one integration test exists for each major infrastructure dependency. | Integration tests cover all main data access paths and API endpoints. | Integration tests are comprehensive, fast, and use isolated test environments or containers. |
| Dependency management | Dependency injection is used in new code. The team understands the direction of dependencies. | Business logic projects have no direct references to infrastructure frameworks. | Static analysis or build rules enforce dependency direction. No violations exist. |
| Testability | At least one critical business rule can be tested in isolation. | Most business logic can be tested without external dependencies. | All business logic is fully testable in isolation. Test doubles are simple and well-maintained. |
| Maintainability | No new classes exceed the size limit. Legacy hotspots are identified. | The team actively refactors legacy code toward the target structure. | Code quality metrics are tracked, trended, and continuously improved. |

## Anti-Patterns

- **The God Class.** One massive service class that handles five or six unrelated capabilities. Nobody can make a change without reading 8,000 lines of context first. Split it into focused services aligned to specific capabilities.

- **Business logic in stored procedures.** Interest rate calculations, compliance rules, and fee logic buried in SQL stored procedures that no unit test framework can reach. The only way to verify them is to run a full database with test data and hope you covered the edge cases. Move calculations into application code where they can be tested properly.

- **The untestable controller.** An API controller that directly queries the database, applies business rules, calls three external services, formats the response, and logs audit events, all in a single method. Extract the business logic into a service class, the data access into a repository, and the external calls into gateway classes.

- **Dependency injection as a formality.** The team technically uses a DI container, but every class has 20 constructor parameters and the business logic still calls `DateTime.Now` and `HttpClient` directly. Dependency injection only helps testability if you actually inject abstractions that can be replaced in tests.

- **Test suite nobody runs.** There are 2,000 tests in the solution but they take 45 minutes to run, half of them need a live database, and 30 of them fail randomly due to timing issues. Developers ignore the suite and merge without waiting for results. Fast, reliable tests are non-negotiable. Fix or delete flaky tests.

- **Shared database as integration layer.** Two modules both read and write to the same database tables. There are no module boundaries. A schema change for one breaks the other. Each module should own its data and expose it through a defined interface.

- **Copy-paste compliance logic.** The same regulatory check (like an OFAC screening call or a debt-to-income ratio calculation) is duplicated across six different services with slight variations. Nobody knows which version is correct. Extract shared compliance logic into a tested, versioned library or a dedicated compliance service.

- **Framework lock-in disguised as architecture.** Every class inherits from a framework base class. Your domain entities extend `HibernateEntity` or `EntityFrameworkBase`. Your business logic is welded to the persistence framework. If the framework changes or you need to switch databases, you are rewriting everything. Keep your domain objects plain and framework-free.

## Getting Started

1. **Pick your worst pain point.** Find the one class or module that the team dreads changing. The one that has caused the most production incidents or the most merge conflicts. That is where you will get the most value from refactoring first.

2. **Add tests before you refactor.** Before you restructure anything, write characterization tests that capture the current behavior. These do not have to be pretty. They just need to tell you if you accidentally changed something. Once you have that safety net, start extracting business logic into testable classes.

3. **Set up your CI pipeline to run tests and block on failure.** This is the single most impactful thing you can do. Once tests are part of your build process and failures block merges, the team will naturally start writing better tests and keeping them green.

4. **Agree on a target project structure as a team.** Draw a simple diagram showing where domain logic, application services, infrastructure, and entry points should live. Put it on a wiki page. Reference it in code reviews. You do not need to move everything at once, but everyone should know where new code belongs.

5. **Refactor incrementally.** Do not try to restructure your entire application in one sprint. Every time you touch a piece of code for a bug fix or a feature, leave it a little better. Extract one class. Add one test. Remove one dependency on a concrete implementation. Over time, these small improvements compound into a fundamentally better codebase.

*This tenet is part of the Architecture Modernization initiative. See the [Architecture Tenets Overview](./00-Architecture-Tenets-Overview.md) for the full set of tenets, the maturity model, and the scoring framework.*
