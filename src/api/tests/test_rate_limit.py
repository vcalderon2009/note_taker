def test_rate_limit_triggers_on_messages(client):
    headers = {"X-User-Id": "u1"}
    # Use the default limit=10; send 11 requests
    for i in range(10):
        r = client.post(
            "/api/conversations/1/messages", json={"text": f"note {i}"}, headers=headers
        )
        assert r.status_code == 200
    r = client.post("/api/conversations/1/messages", json={"text": "note 11"}, headers=headers)
    assert r.status_code == 429
