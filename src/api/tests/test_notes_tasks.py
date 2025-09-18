def test_create_and_list_note(client):
    r = client.post("/api/notes", json={"title": "T1", "body": "B1"})
    assert r.status_code == 200
    note = r.json()
    assert note["title"] == "T1"
    r2 = client.get("/api/notes")
    assert r2.status_code == 200
    notes = r2.json()
    assert any(n["id"] == note["id"] for n in notes)


def test_create_and_list_task(client):
    r = client.post("/api/tasks", json={"title": "Task1"})
    assert r.status_code == 200
    task = r.json()
    assert task["status"] == "todo"
    r2 = client.get("/api/tasks")
    assert r2.status_code == 200
    tasks = r2.json()
    assert any(t["id"] == task["id"] for t in tasks)
