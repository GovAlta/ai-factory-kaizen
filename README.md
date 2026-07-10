# AI Factory Kaizen

An evaluation framework for checking whether a new AI-assisted software delivery factory's core
delivery function is at least on par with existing harnesses (Keystone, `goa-software-factory`,
`factory-encore`, AIDE-VELOCITY-HARNESS) — and, where it isn't, whether that's offset by a clear,
evidenced improvement elsewhere (maintainability, avoided duplication).

Lives outside every harness it evaluates, including the factory it's built alongside. Live
execution comparison (Tier A) runs against Keystone; the remaining three are compared structurally
from documented evidence (Tier B). See [`docs/EVALUATION-FRAMEWORK.md`](docs/EVALUATION-FRAMEWORK.md)
for the full design rationale and [`docs/PRODUCT-BRIEF.md`](docs/PRODUCT-BRIEF.md) for it restated
as buildable requirements.

**Status**: planning — implementation language/runtime, exact par thresholds, and judge-panel
model are still open (`[NEEDS CLARIFICATION]` in the product brief).
