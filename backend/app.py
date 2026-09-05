from flask import Flask, jsonify, request, send_from_directory
import pymysql
import os
import json
from openai import OpenAI, RateLimitError
from flask_cors import CORS

app = Flask(__name__, static_folder="../frontend", static_url_path="")
CORS(app)


db = pymysql.connect(
    host="localhost",
    user="root",
    password="spiderman",
    database="studypro",
    cursorclass=pymysql.cursors.DictCursor
)

@app.before_request
def reconnect_db():
    try:
        db.ping(reconnect=True)
    except Exception:
        pass

@app.before_request
def keep_db_connection_alive():
    db.ping(reconnect=True)

api_key = os.environ.get("OPENAI_API_KEY")

if api_key:
    client = OpenAI(api_key=api_key)
else:
    client = None

@app.route("/")
def home():
    return send_from_directory("../frontend", "index.html")

@app.route("/subjects")
def subjects():
    cursor = db.cursor()

    cursor.execute("""
    SELECT
        subjects.subject_id AS id,
        subjects.user_id,
        subjects.subjects AS name,
        subjects.symbol,

        COUNT(chapters.chapter_id) AS total_chapters,

        COALESCE(
            SUM(chapters.completed),
            0
        ) AS completed_chapters

    FROM subjects

    LEFT JOIN chapters
        ON subjects.subject_id = chapters.subject_id

    GROUP BY
        subjects.subject_id,
        subjects.user_id,
        subjects.subjects,
        subjects.symbol

    ORDER BY subjects.subject_id
""")

    data = cursor.fetchall()

    cursor.close()

    return jsonify(data)


@app.route("/users/<int:user_id>/subjects")
def get_user_subjects(user_id):
    cursor = db.cursor()

    cursor.execute("""
        SELECT
            subject_id AS id,
            user_id,
            subjects AS name
        FROM subjects
        WHERE user_id = %s
        ORDER BY subject_id
    """, (user_id,))

    data = cursor.fetchall()

    cursor.close()

    return jsonify(data)

@app.route("/subjects", methods=["POST"])
def add_subject():
    data = request.get_json()

    user_id = data["user_id"]
    subject_name = data["name"]
    symbol= data.get("symbol","⚛")

    cursor = db.cursor()

    cursor.execute(
    """
    INSERT INTO subjects (user_id, subjects, symbol)
    VALUES (%s, %s, %s)
    """,
    (user_id, subject_name, symbol)
)

    db.commit()
    new_subject_id = cursor.lastrowid
    cursor.close()

    return jsonify({
        "message": "Subject added successfully",
        "id": new_subject_id,
        "name": subject_name,
        "symbol": symbol
    }), 201

@app.route("/subjects/<int:subject_id>", methods=["PUT"])
def update_subject(subject_id):
    data = request.get_json()

    subject_name = data["name"]

    cursor = db.cursor()

    cursor.execute(
        "UPDATE subjects SET subjects = %s WHERE subject_id = %s",
        (subject_name, subject_id)
    )

    db.commit()

    cursor.close()

    return jsonify({
        "message": "Subject updated successfully",
        "id": subject_id,
        "name": subject_name
    })

@app.route("/subjects/<int:subject_id>", methods=["DELETE"])
def delete_subject(subject_id):
    cursor = db.cursor()

    cursor.execute(
        "DELETE FROM subjects WHERE subject_id = %s",
        (subject_id,)
    )

    db.commit()

    cursor.close()

    return jsonify({
        "message": "Subject deleted successfully",
        "id": subject_id
    })

@app.route("/users", methods=["POST"])
def create_user():
    data = request.get_json()

    name = data["name"]
    class_level = data["class_level"]
    board = data["board"]
    stream = data.get("stream")

    cursor = db.cursor()

    cursor.execute(
        """
        INSERT INTO users (name, class_level, board, stream, created_at)
        VALUES (%s, %s, %s, %s, CURDATE())
        """,
        (name, class_level, board, stream)
    )

    db.commit()

    new_user_id = cursor.lastrowid

    cursor.close()

    return jsonify({
        "message": "Student profile created successfully",
        "user_id": new_user_id,
        "name": name,
        "class_level": class_level,
        "board": board,
        "stream": stream
    }), 201

@app.route("/chapters/<int:chapter_id>")
def get_chapter(chapter_id):

    cursor = db.cursor()

    cursor.execute(
        """
        SELECT
            chapter_id,
            chapter_no,
            chapter_name,
            difficulty,
            completed,
            confidence,
            revision_count,
            DATE_FORMAT(last_revised, '%%Y-%%m-%%d') AS last_revised
        FROM chapters
        WHERE chapter_id = %s
        """,
        (chapter_id,)
    )

    chapter = cursor.fetchone()

    cursor.close()

    if not chapter:
        return jsonify({
            "message": "Chapter not found"
        }), 404

    return jsonify(chapter)

@app.route("/subjects/<int:subject_id>/chapters")
def get_chapters(subject_id):
    cursor = db.cursor()

    cursor.execute(
        """
        SELECT
            chapter_id,
            chapter_no,
            chapter_name,
            difficulty,
            completed,
            confidence,
            revision_count,DATE_FORMAT(last_revised, '%%Y-%%m-%%d') AS last_revised
        FROM chapters
        WHERE subject_id = %s
        ORDER BY chapter_no
        """,
        (subject_id,)
    )

    data = cursor.fetchall()

    cursor.close()

    return jsonify(data)

@app.route("/chapters", methods=["POST"])
def add_chapter():
    data = request.get_json()

    subject_id = data["subject_id"]
    chapter_no = data["chapter_no"]
    chapter_name = data["chapter_name"]
    difficulty = data.get("difficulty", "Medium")

    cursor = db.cursor()

    cursor.execute(
        """
        INSERT INTO chapters (subject_id, chapter_no, chapter_name, difficulty)
        VALUES (%s, %s, %s, %s)
        """,
        (subject_id, chapter_no, chapter_name, difficulty)
    )

    db.commit()

    new_chapter_id = cursor.lastrowid

    cursor.close()

    return jsonify({
        "message": "Chapter added successfully",
        "chapter_id": new_chapter_id,
        "chapter_name": chapter_name,
        "difficulty": difficulty
    }), 201

@app.route("/chapters/<int:chapter_id>/complete", methods=["PUT"])
def complete_chapter(chapter_id):

    data = request.get_json() or {}

    completed = bool(data.get("completed", False))

    cursor = db.cursor()

    cursor.execute(
        """
        UPDATE chapters
        SET completed = %s
        WHERE chapter_id = %s
        """,
        (completed, chapter_id)
    )

    db.commit()

    cursor.close()

    return jsonify({
        "message": "Chapter status updated",
        "chapter_id": chapter_id,
        "completed": completed
    })
    data = request.get_json()

    completed = data.get("completed", False)

    cursor = db.cursor()

    cursor.execute(
        """
        UPDATE chapters
        SET completed = %s
        WHERE chapter_id = %s
        """,
        (completed, chapter_id)
    )

    db.commit()

    cursor.close()

    return jsonify({
        "message": "Chapter completion updated",
        "chapter_id": chapter_id,
        "completed": completed
    })
    cursor = db.cursor()

    cursor.execute(
        "UPDATE chapters SET completed = TRUE WHERE chapter_id = %s",
        (chapter_id,)
    )

    db.commit()

    cursor.close()

    return jsonify({
        "message": "Chapter marked as completed",
        "chapter_id": chapter_id,
        "completed": True
    })

@app.route("/chapters/<int:chapter_id>/confidence", methods=["PUT"])
def update_confidence(chapter_id):
    data = request.get_json()

    confidence = data["confidence"]

    if confidence < 1 or confidence > 5:
        return jsonify({
            "message": "Confidence must be between 1 and 5"
        }), 400

    cursor = db.cursor()

    cursor.execute(
        "UPDATE chapters SET confidence = %s WHERE chapter_id = %s",
        (confidence, chapter_id)
    )

    db.commit()

    cursor.close()

    return jsonify({
        "message": "Confidence updated successfully",
        "chapter_id": chapter_id,
        "confidence": confidence
    })

@app.route("/chapters/<int:chapter_id>/revise", methods=["POST"])
def revise_chapter(chapter_id):
    cursor = db.cursor()

    cursor.execute(
        """
        UPDATE chapters
        SET revision_count = revision_count + 1,
            last_revised = CURDATE()
        WHERE chapter_id = %s
        """,
        (chapter_id,)
    )

    db.commit()

    cursor.execute(
        """
        SELECT revision_count, last_revised
        FROM chapters
        WHERE chapter_id = %s
        """,
        (chapter_id,)
    )

    chapter = cursor.fetchone()

    cursor.close()

    return jsonify({
        "message": "Revision recorded successfully",
        "chapter_id": chapter_id,
        "revision_count": chapter["revision_count"],
        "last_revised": chapter["last_revised"]
    })


@app.route("/chapters/<int:chapter_id>", methods=["PUT"])
def update_chapter(chapter_id):
    data = request.get_json()

    chapter_no = data["chapter_no"]
    chapter_name = data["chapter_name"]
    difficulty = data["difficulty"]

    cursor = db.cursor()

    cursor.execute(
        """
        UPDATE chapters
        SET chapter_no = %s,
            chapter_name = %s,
            difficulty = %s
        WHERE chapter_id = %s
        """,
        (chapter_no, chapter_name, difficulty, chapter_id)
    )

    db.commit()

    cursor.close()

    return jsonify({
        "message": "Chapter updated successfully",
        "chapter_id": chapter_id,
        "chapter_name": chapter_name,
        "difficulty": difficulty
    })

@app.route("/chapters/<int:chapter_id>", methods=["DELETE"])
def delete_chapter(chapter_id):
    cursor = db.cursor()

    cursor.execute(
        "DELETE FROM chapters WHERE chapter_id = %s",
        (chapter_id,)
    )

    db.commit()

    cursor.close()

    return jsonify({
        "message": "Chapter deleted successfully",
        "chapter_id": chapter_id
    })

@app.route("/users/<int:user_id>/progress")
def get_progress(user_id):
    cursor = db.cursor()

    cursor.execute(
        """
        SELECT
            COUNT(chapters.chapter_id) AS total_chapters,
            COALESCE(SUM(chapters.completed), 0) AS completed_chapters,
            COALESCE(SUM(chapters.revision_count), 0) AS total_revisions,
            COALESCE(SUM(
                CASE
                    WHEN chapters.completed = 1
                    AND chapters.revision_count = 0
                    THEN 1
                    ELSE 0
                END
            ), 0) AS needs_first_revision
        FROM subjects
        LEFT JOIN chapters
            ON subjects.subject_id = chapters.subject_id
        WHERE subjects.user_id = %s
        """,
        (user_id,)
    )

    row = cursor.fetchone()

    cursor.close()

    total_chapters = int(row["total_chapters"] or 0)
    completed_chapters = int(row["completed_chapters"] or 0)
    total_revisions = int(row["total_revisions"] or 0)
    needs_first_revision = int(row["needs_first_revision"] or 0)

    if total_chapters == 0:
        progress_percentage = 0
    else:
        progress_percentage = round(
            (completed_chapters / total_chapters) * 100
        )

    return jsonify({
        "total_chapters": total_chapters,
        "completed_chapters": completed_chapters,
        "pending_chapters": total_chapters - completed_chapters,
        "needs_first_revision": needs_first_revision,
        "total_revisions": total_revisions,
        "progress_percentage": progress_percentage
    })

@app.route("/users/<int:user_id>/subjects/progress")
def get_subject_progress(user_id):
    cursor = db.cursor()

    cursor.execute(
        """
        SELECT
            subjects.subject_id,
            subjects.subjects AS subject_name,
            COUNT(chapters.chapter_id) AS total_chapters,
            COALESCE(SUM(chapters.completed), 0) AS completed_chapters
        FROM subjects
        LEFT JOIN chapters
            ON subjects.subject_id = chapters.subject_id
        WHERE subjects.user_id = %s
        GROUP BY subjects.subject_id, subjects.subjects
        ORDER BY subjects.subjects
        """,
        (user_id,)
    )

    rows = cursor.fetchall()

    cursor.close()

    data = []

    for row in rows:
        total = int(row["total_chapters"] or 0)
        completed = int(row["completed_chapters"] or 0)

        if total == 0:
            progress = 0
        else:
            progress = round((completed / total) * 100)

        data.append({
            "subject_id": row["subject_id"],
            "subject_name": row["subject_name"],
            "total_chapters": total,
            "completed_chapters": completed,
            "progress_percentage": progress
        })

    return jsonify(data)

@app.route("/users/<int:user_id>/dashboard")
def get_dashboard(user_id):
    overall_progress = get_progress(user_id).get_json()

    subject_progress = get_subject_progress(user_id).get_json()

    return jsonify({
        "overall": overall_progress,
        "subjects": subject_progress
    })

@app.route("/users/<int:user_id>/ai-insights")
def get_ai_insights(user_id):
    if client is None:
        return jsonify({
            "message": "OpenAI API key is not set."
        }), 500

    dashboard_data = get_dashboard(user_id).get_json()

    cursor = db.cursor()

    cursor.execute(
        """
        SELECT
            subjects.subjects AS subject_name,
            chapters.chapter_name,
            chapters.difficulty,
            chapters.completed,
            chapters.confidence,
            chapters.revision_count,
            DATE_FORMAT(chapters.last_revised, '%%Y-%%m-%%d') AS last_revised
        FROM subjects
        LEFT JOIN chapters
            ON subjects.subject_id = chapters.subject_id
        WHERE subjects.user_id = %s
        """,
        (user_id,)
    )

    chapter_data = cursor.fetchall()

    cursor.close()

    prompt = f"""
You are StudyPro's helpful study coach.

Use only the student's data below.
Give exactly 3 short, practical study insights.
Do not invent chapters, marks, exam dates, or facts.
Do not change the student's schedule or database.
Use simple, encouraging language.

Dashboard data:
{json.dumps(dashboard_data)}

Chapter data::
{json.dumps(chapter_data)}
"""

    try:
        response = client.responses.create(
            model="gpt-5.2",
            input=prompt,
            text={"verbosity": "low"}
        )

    except RateLimitError:
        return jsonify({
            "message": "AI insights are temporarily unavailable because the API account has no remaining credits."
        }), 503

    return jsonify({
        "ai_insights": response.output_text
    })

@app.route("/exams", methods=["POST"])
def add_exam():
    data = request.get_json()

    user_id = data["user_id"]
    subject_id = data["subject_id"]
    exam_name = data["exam_name"]
    exam_date = data["exam_date"]

    cursor = db.cursor()

    cursor.execute(
        """
        INSERT INTO exams (user_id, subject_id, exam_name, exam_date)
        VALUES (%s, %s, %s, %s)
        """,
        (user_id, subject_id, exam_name, exam_date)
    )

    db.commit()

    exam_id = cursor.lastrowid

    cursor.close()

    return jsonify({
        "message": "Exam added successfully",
        "exam_id": exam_id,
        "exam_name": exam_name,
        "exam_date": exam_date
    }), 201

@app.route("/users/<int:user_id>/exams")
def get_exams(user_id):
    cursor = db.cursor()

    cursor.execute(
        """
        SELECT
            exams.exam_id,
            exams.exam_name,
            subjects.subjects AS subject_name,
            DATE_FORMAT(exams.exam_date, '%%Y-%%m-%%d') AS exam_date,
            DATEDIFF(exams.exam_date, CURDATE()) AS days_remaining
        FROM exams
        JOIN subjects
            ON exams.subject_id = subjects.subject_id
        WHERE exams.user_id = %s
        ORDER BY exams.exam_date
        """,
        (user_id,)
    )

    data = cursor.fetchall()

    cursor.close()

    return jsonify(data)

@app.route("/tasks", methods=["POST"])
def add_task():
    data = request.get_json()

    user_id = data["user_id"]
    task_title = data["task_title"]
    task_date = data["task_date"]

    subject_id = data.get("subject_id")
    chapter_id = data.get("chapter_id")
    duration_minutes = data.get("duration_minutes", 30)

    cursor = db.cursor()

    cursor.execute(
        """
        INSERT INTO study_tasks (
            user_id,
            subject_id,
            chapter_id,
            task_title,
            task_date,
            duration_minutes
        )
        VALUES (%s, %s, %s, %s, %s, %s)
        """,
        (
            user_id,
            subject_id,
            chapter_id,
            task_title,
            task_date,
            duration_minutes
        )
    )

    db.commit()

    task_id = cursor.lastrowid

    cursor.close()

    return jsonify({
        "message": "Study task added successfully",
        "task_id": task_id,
        "task_title": task_title,
        "task_date": task_date
    }), 201

@app.route("/users/<int:user_id>/tasks")
def get_tasks(user_id):
    cursor = db.cursor()

    cursor.execute(
        """
        SELECT
            study_tasks.task_id,
            study_tasks.task_title,
            DATE_FORMAT(study_tasks.task_date, '%%Y-%%m-%%d') AS task_date,
            study_tasks.duration_minutes,
            study_tasks.status,
            subjects.subjects AS subject_name,
            chapters.chapter_name
        FROM study_tasks
        LEFT JOIN subjects
            ON study_tasks.subject_id = subjects.subject_id
        LEFT JOIN chapters
            ON study_tasks.chapter_id = chapters.chapter_id
        WHERE study_tasks.user_id = %s
        ORDER BY study_tasks.task_date
        """,
        (user_id,)
    )

    data = cursor.fetchall()

    cursor.close()

    return jsonify(data)

@app.route("/tasks/<int:task_id>/complete", methods=["PUT"])
def complete_task(task_id):
    cursor = db.cursor()

    cursor.execute(
        """
        UPDATE study_tasks
        SET status = 'completed'
        WHERE task_id = %s
        """,
        (task_id,)
    )

    db.commit()

    cursor.close()

    return jsonify({
        "message": "Task marked as completed",
        "task_id": task_id,
        "status": "completed"
    })

@app.route("/tasks/<int:task_id>", methods=["PUT"])
def update_task(task_id):
    data = request.get_json()

    task_title = data["task_title"]
    task_date = data["task_date"]
    duration_minutes = data["duration_minutes"]

    cursor = db.cursor()

    cursor.execute(
        """
        UPDATE study_tasks
        SET task_title = %s,
            task_date = %s,
            duration_minutes = %s
        WHERE task_id = %s
        """,
        (task_title, task_date, duration_minutes, task_id)
    )

    db.commit()

    cursor.close()

    return jsonify({
        "message": "Task updated successfully",
        "task_id": task_id
    })

@app.route("/tasks/<int:task_id>", methods=["DELETE"])
def delete_task(task_id):
    cursor = db.cursor()

    cursor.execute(
        "DELETE FROM study_tasks WHERE task_id = %s",
        (task_id,)
    )

    db.commit()

    cursor.close()

    return jsonify({
        "message": "Task deleted successfully",
        "task_id": task_id
    })

@app.route("/users/<int:user_id>/syllabus/auto-populate", methods=["POST"])
def auto_populate_syllabus(user_id):
    data = request.get_json()

    subject_id = data["subject_id"]
    board = data["board"]
    class_level = data["class_level"]
    subject_name = data["subject_name"]

    cursor = db.cursor()

    cursor.execute(
        """
        SELECT chapter_no, chapter_name, difficulty
        FROM syllabus_templates
        WHERE board = %s
          AND class_level = %s
          AND subject_name = %s
        ORDER BY chapter_no
        """,
        (board, class_level, subject_name)
    )

    templates = cursor.fetchall()

    if not templates:
        cursor.close()

        return jsonify({
            "message": "No templates found for this board, class level, and subject"
        }), 404

    chapters_added = 0
    chapters_skipped = 0

    for template in templates:
        cursor.execute(
            """
            SELECT chapter_id
            FROM chapters
            WHERE subject_id = %s
            AND chapter_no = %s
            AND chapter_name = %s
            """,
            (
                subject_id,
                template["chapter_no"],
                template["chapter_name"]
            )
        )

        existing_chapter = cursor.fetchone()

        if existing_chapter:
            chapters_skipped += 1

        else:
            cursor.execute(
                """
                INSERT INTO chapters (
                    subject_id,
                    chapter_no,
                    chapter_name,
                    difficulty
                )
                VALUES (%s, %s, %s, %s)
                """,
                (
                    subject_id,
                    template["chapter_no"],
                    template["chapter_name"],
                    template["difficulty"]
                )
            )

            chapters_added += 1

    db.commit()

    cursor.close()

    return jsonify({
        "message": "Syllabus populated successfully",
        "chapters_added": chapters_added,
        "subject_id": subject_id,
        "subject_name": subject_name,
        "board": board,
        "class_level": class_level
    }), 201

app.run(debug=True)