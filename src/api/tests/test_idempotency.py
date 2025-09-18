def test_idempotency_repeats_previous_response(client):
    headers = {"Idempotency-Key": "abc123", "X-User-Id": "idempotency_test_user"}
    r1 = client.post("/api/conversations/1/messages", json={"text": "task: one"}, headers=headers)
    r2 = client.post("/api/conversations/1/messages", json={"text": "task: two"}, headers=headers)
    assert r1.status_code == 200 and r2.status_code == 200
    assert r1.json() == r2.json()
