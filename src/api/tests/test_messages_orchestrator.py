def test_post_message_creates_note_by_default(client):
    headers = {"X-User-Id": "orchestrator_note_test_user"}
    r = client.post("/api/conversations/1/messages", json={"text": "My note body"}, headers=headers)
    assert r.status_code == 200
    data = r.json()
    assert data["type"] == "note"


def test_post_message_creates_task_when_keyword_present(client):
    headers = {"X-User-Id": "orchestrator_task_test_user"}
    r = client.post("/api/conversations/1/messages", json={"text": "task: buy milk"}, headers=headers)
    assert r.status_code == 200
    data = r.json()
    assert data["type"] == "task"
