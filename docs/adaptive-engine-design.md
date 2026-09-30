# Adaptive Troubleshooting Engine Design

## Objective

Select the next approved troubleshooting action that is most likely to resolve the current problem with acceptable risk, while avoiding repeated failed actions and escalating when autonomy is no longer justified.

## Inputs

- Problem description
- Category and problem type
- User answers and context
- RAG retrieval results
- Previous actions
- Failed actions
- Historical outcomes
- AI confidence
- Severity and risk

## Scoring

```text
Final Score =
  historical success
+ problem similarity
+ context match
+ RAG relevance
+ AI confidence
- previous failure penalty
- risk penalty
```

All components are normalized between 0 and 1. Weights are configurable and must later be editable by admins.

## Escalation

The engine recommends escalation for critical severity, low confidence, excessive failed attempts, unavailable approved actions, high-risk action paths, or explicit user request.

## Research Integrity

The initial engine is an interpretable adaptive decision and scoring mechanism. It must not be described as machine learning. The scoring component is isolated so a future ML model can replace it.

