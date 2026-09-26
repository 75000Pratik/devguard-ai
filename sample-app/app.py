import os

from flask import Flask, request, jsonify
from services.task_service import TaskService
from utils.validators import is_valid_status, validate_task_payload

app = Flask(__name__)

# D6: debug mode is now controlled by the FLASK_DEBUG environment variable.
# Defaults to False (disabled) when the variable is absent or set to anything
# other than "1" / "true" / "yes".
_debug_env = os.environ.get("FLASK_DEBUG", "0").strip().lower()
app.config["DEBUG"] = _debug_env in ("1", "true", "yes")

task_service = TaskService()


# ── Global error handlers (D7) ────────────────────────────────────────────────

@app.errorhandler(400)
def bad_request(exc):
    """Return a JSON 400 for malformed or non-JSON requests."""
    description = getattr(exc, "description", "Bad request")
    return jsonify({"error": str(description)}), 400


@app.errorhandler(404)
def not_found(exc):
    """Return a JSON 404 instead of Flask's default HTML page."""
    return jsonify({"error": "Not found"}), 404


@app.errorhandler(405)
def method_not_allowed(exc):
    """Return a JSON 405 instead of Flask's default HTML page."""
    return jsonify({"error": "Method not allowed"}), 405


# ── Routes ────────────────────────────────────────────────────────────────────

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"}), 200


@app.route("/tasks", methods=["GET"])
def get_tasks():
    tasks = task_service.get_all()
    return jsonify(tasks), 200


@app.route("/tasks/<int:task_id>", methods=["GET"])
def get_task(task_id):
    task = task_service.get_by_id(task_id)
    if task is None:
        return jsonify({"error": "Task not found"}), 404
    return jsonify(task), 200


@app.route("/tasks", methods=["POST"])
def create_task():
    # D7: force_json=False so we handle the None-data case ourselves instead
    # of letting Flask raise an unhandled 400 with an HTML response.
    data = request.get_json(silent=True)

    # D4: validation delegated to the shared helper in validators.py
    error_msg, error_code = validate_task_payload(data)
    if error_msg:
        return jsonify({"error": error_msg}), error_code

    task = task_service.create(
        title=data["title"].strip(),
        description=data.get("description", ""),
        status=data.get("status", "todo"),
    )
    return jsonify(task), 201


@app.route("/tasks/<int:task_id>", methods=["PUT"])
def update_task(task_id):
    data = request.get_json(silent=True)

    if not data:
        return jsonify({"error": "No data provided"}), 400

    status = data.get("status")
    # D4: status validation now uses the shared helper instead of an inline check
    if not is_valid_status(status):
        return jsonify({"error": "Invalid status"}), 400

    task = task_service.update_status(task_id, status)
    if task is None:
        return jsonify({"error": "Task not found"}), 404
    return jsonify(task), 200


@app.route("/tasks/<int:task_id>", methods=["DELETE"])
def delete_task(task_id):
    deleted = task_service.delete(task_id)
    if not deleted:
        return jsonify({"error": "Task not found"}), 404
    return jsonify({"deleted": task_id}), 200


if __name__ == "__main__":
    # D6: honour the same env flag at direct-run time; default off
    app.run(
        debug=app.config["DEBUG"],
        host="0.0.0.0",
        port=5000,
    )
