import pytest
from fastapi.testclient import TestClient
from langchain_core.messages import HumanMessage, AIMessage

from app.main import app
from chatbot.config import settings
from chatbot.schemas import ChatRequest, ChatResponse, SourceRef
from chatbot.memory import SessionState, InMemorySessionStore
from chatbot.ingestion import run_ingestion
from chatbot.workflow_router import classify_workflow

client = TestClient(app)


def test_config_defaults():
    assert settings.LLM_MODEL == "gpt-4o-mini"
    assert settings.EMBEDDING_MODEL == "text-embedding-3-small"
    assert settings.RETRIEVAL_K == 4
    assert settings.MAX_HISTORY_TURNS == 6


def test_schemas():
    source = SourceRef(workflow="billing", file="billing.md", chunk_preview="Sample preview")
    req = ChatRequest(message="How to upgrade?")
    res = ChatResponse(session_id="test-session", reply="Upgrade via settings.", sources=[source])

    assert req.session_id is None
    assert res.session_id == "test-session"
    assert len(res.sources) == 1
    assert res.sources[0].workflow == "billing"


def test_session_state_history_trimming():
    state = SessionState(session_id="test-trim")
    for i in range(10):
        state.messages.append(HumanMessage(content=f"Question {i}"))
        state.messages.append(AIMessage(content=f"Answer {i}"))

    assert len(state.messages) == 20
    trimmed = state.trim_history(max_turns=3)
    assert len(trimmed) == 6
    assert trimmed[0].content == "Question 7"
    assert trimmed[-1].content == "Answer 9"


def test_in_memory_session_store():
    import asyncio

    async def _test():
        store = InMemorySessionStore(ttl_seconds=1)
        session = await store.create()
        session_id = session.session_id

        fetched = await store.get(session_id)
        assert fetched is not None
        assert fetched.session_id == session_id

        fetched.messages.append(HumanMessage(content="Hello"))
        await store.save(session_id, fetched)

        updated = await store.get(session_id)
        assert len(updated.messages) == 1

    asyncio.run(_test())



def test_health_endpoint():
    response = client.get("/api/v1/chatbot/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_ingestion_and_classification():
    summary = run_ingestion()
    assert "billing" in summary
    assert "onboarding" in summary
    assert "password_reset" in summary

    # Run workflow router classification test
    workflows = classify_workflow("How do I reset my password?")
    # Even with FakeEmbeddings or test embeddings, classify_workflow executes cleanly
    assert isinstance(workflows, list)


def test_chat_endpoint():
    payload = {"message": "How do I upgrade my billing plan?"}
    response = client.post("/api/v1/chatbot/chat", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "session_id" in data
    assert "reply" in data
    assert "sources" in data

    # Test follow-up message using the session_id
    session_id = data["session_id"]
    followup_payload = {"session_id": session_id, "message": "What about refunds?"}
    followup_response = client.post("/api/v1/chatbot/chat", json=followup_payload)
    assert followup_response.status_code == 200
    followup_data = followup_response.json()
    assert followup_data["session_id"] == session_id
