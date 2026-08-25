# Rakshak AI Knowledge Base

## Purpose

`ai-ml/kb/` contains concise operational truth used to ground Kavach-specific chatbot answers.

The current selector uses lightweight lexical/keyword scoring rather than embeddings or a vector database. The best relevant file is injected into the model context.

## Maintenance rule

Whenever backend behavior changes, update the corresponding KB file in the same change. Especially keep these facts synchronized:

- danger-zone notification recipients;
- signal-loss timing and leader actions;
- Disaster Management dispatch boundary;
- emergency-service live tracking;
- group QR behavior;
- blockchain individual/group snapshot contents and integrity states;
- chatbot history and account behavior.

A KB miss is not a refusal condition. Normal conversation still proceeds to Groq.

## Live versus static data

Static Markdown explains rules and architecture. It must not fabricate current locations, current incidents or current safe zones. Where implemented, those questions use authenticated live context from `KAVACH_API_URL`.
