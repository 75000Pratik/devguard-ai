class TaskService:
    """In-memory task storage."""

    def __init__(self):
        self._tasks = {}
        self._next_id = 1

    def get_all(self):
        return list(self._tasks.values())

    def get_by_id(self, task_id):
        # D2: returns None instead of raising / signalling 404
        return self._tasks.get(task_id)

    def create(self, title, description, status):
        task = {
            "id": self._next_id,
            "title": title,
            "description": description,
            "status": status,
        }
        self._tasks[self._next_id] = task
        self._next_id += 1
        return task

    def update_status(self, task_id, status):
        task = self._tasks.get(task_id)
        if task is None:
            # D2: returns None silently instead of raising a 404-triggering error
            return None

        task["status"] = status
        return task

    def delete(self, task_id):
        if task_id not in self._tasks:
            return False
        del self._tasks[task_id]
        return True
