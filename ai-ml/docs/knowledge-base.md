# Rakshak Knowledge Base

The files under `ai-ml/kb/` are runtime grounding inputs consumed directly by `kbSelector.ts`. They are not merely project notes.

## 1. Retrieval algorithm

For each user message:

```text
message
  |
  v
lowercase + punctuation removal
  |
  v
tokenize
  |
  v
remove common stopwords
  |
  v
score every .md/.txt KB file
  |   + frequency of each query token in file
  |   + filename bonus (+3 per matching token)
  v
sort highest score
  |
  +--> score < 1 -> no KB selected
  |
  `--> score >= 1 -> inject complete winning file into prompt
```

Only one static file is selected per turn in the current implementation.

## 2. Why the KB is split by topic

Current files are organized so lexical questions naturally map to the right source:

- `trips-and-groups.md`: trip lifecycle, solo/group planning, locking, joining.
- `emergency-safety.md`: safety zones, signal loss, trip safety behavior.
- `emergency-response.md`: SOS, incidents, Disaster Management, responder dispatch.
- `blockchain.md`: credential/blockchain integrity behavior.
- `chatbot-and-accounts.md`: accounts, Rakshak capabilities, history/privacy boundaries.

## 3. Live context outranks KB text

Static files describe product behavior, but they cannot know a live user's current incident, nearest safe zone, group state, or current dispatch. Where live application context is supplied, the system prompt tells Groq to prefer it over KB prose.

## 4. What belongs in a KB file

Include:

- stable product rules;
- user-visible workflows;
- role responsibilities;
- feature limitations;
- terminology;
- safety behavior that helps answer user questions.

Avoid:

- deployment secrets;
- private user records;
- temporary incident IDs;
- production credentials;
- implementation logs;
- release-date changelogs;
- obsolete planned behavior.

## 5. Writing style for retrieval

Because matching is lexical, use the words users actually ask about. For example, a group document should naturally contain terms such as `group`, `join`, `QR`, `leader`, `lock`, `member`, and `planning`.

Do not pad files with irrelevant keywords simply to manipulate selection. Retrieval quality depends on topical separation.

## 6. Maintaining the KB after code changes

When a backend rule changes:

1. update the authoritative backend/client behavior;
2. update the corresponding KB topic;
3. update the human-facing docs if architecture/API behavior changed;
4. ask several representative questions and confirm the intended KB file wins;
5. verify the model does not state old behavior.

## 7. Failure mode

No KB match does not block chat. The system prompt explicitly states that normal conversation can continue without a selected document.

This matters for greetings and unrelated conversational turns, where forcing a KAVACH document would make responses worse rather than safer.

## 8. Security rule

Treat every KB file as shared content potentially exposed through generated answers. Never store anything in `kb/` that one authenticated user should not reveal to another.
