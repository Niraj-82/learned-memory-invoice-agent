
# Learned Memory Agent (Invoice Automation)

This project demonstrates a deterministic, explainable memory-driven system for invoice automation.
Tested on Node.js 18 LTS (Windows)

Key ideas:
- Memory acts as a feature store
- Learning happens via rule induction from human corrections
- Confidence increases with reinforcement and decays over time
- Ambiguity always triggers human review

Run:
npx ts-node src/index.ts
