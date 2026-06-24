import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AppShell } from "../../components/layout/AppShell";
import { Modal } from "../../components/ui/Modal";
import { EmptyState, LoadingState } from "../../components/ui/PageState";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { api } from "../../lib/api/client";
import { formatDate, toArray } from "../../lib/ui/format";

export function TeacherGradesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [courses, setCourses] = useState([]);
  const [grades, setGrades] = useState([]);
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ grade_value: "", result: "PASSED", notes: "" });

  const activeCourseId = searchParams.get("courseId") || "";

  useEffect(() => {
    loadCourses();
  }, []);

  useEffect(() => {
    if (activeCourseId) {
      loadGrades(activeCourseId);
    } else {
      setGrades([]);
      setCourse(null);
      setLoading(false);
    }
  }, [activeCourseId]);

  async function loadCourses() {
    try {
      const res = await api.get("/teachers/me/courses");
      setCourses(toArray(res, ["data"]));
    } catch {
      setCourses([]);
    }
  }

  async function loadGrades(courseId) {
    setLoading(true);
    try {
      const [courseRes, gradesRes] = await Promise.all([
        api.get(`/courses/${courseId}`),
        api.get(`/teachers/me/courses/${courseId}/grades`),
      ]);
      setCourse(courseRes?.data || courseRes);
      setGrades(toArray(gradesRes, ["data"]));
      setError("");
    } catch (loadError) {
      setError(loadError.message || "Couldn't load grades.");
    } finally {
      setLoading(false);
    }
  }

  const stats = useMemo(() => {
    const scores = grades.map((grade) => grade.grade_value).filter((value) => value != null);
    const passed = grades.filter((grade) => (grade.result || "").toUpperCase() === "PASSED").length;
    return {
      passed,
      failed: grades.length - passed,
      average: scores.length ? scores.reduce((sum, value) => sum + value, 0) / scores.length : 0,
    };
  }, [grades]);

  function openModal(grade) {
    setEditing(grade);
    setForm({
      grade_value: grade.grade_value ?? "",
      result: (grade.result || "PASSED").toUpperCase(),
      notes: grade.notes || "",
    });
  }

  async function saveGrade() {
    await api.put(`/teachers/me/grades/${editing._id || editing.id}`, {
      grade_value: parseFloat(form.grade_value),
      result: form.result,
      notes: form.notes.trim() || undefined,
    });
    setEditing(null);
    await loadGrades(activeCourseId);
  }

  return (
    <AppShell title={course?.title || "Grades"}>
      <div className="page-header">
        <div>
          <h1>Grade Book</h1>
          <p>{course ? `Grade book for: ${course.title}` : "All assessed grades for this course."}</p>
        </div>
      </div>

      <div className="filters-bar">
        <label htmlFor="course-select">Select course:</label>
        <select id="course-select" className="form-select" value={activeCourseId} onChange={(e) => setSearchParams(e.target.value ? { courseId: e.target.value } : {})}>
          <option value="">Choose a course</option>
          {courses.map((item) => (
            <option key={item._id || item.id} value={item._id || item.id}>{item.title || item.name || item._id || item.id}</option>
          ))}
        </select>
      </div>

      {!activeCourseId ? <EmptyState title="Select a course above" message="Grade data will appear here." /> : null}
      {activeCourseId && loading ? <LoadingState message="Loading grades..." /> : null}
      {activeCourseId && !loading && error ? <EmptyState title="Couldn't load grades" message={error} /> : null}
      {activeCourseId && !loading && !error && !grades.length ? <EmptyState title="No grades yet" message="Grades added from the course roster will appear here." /> : null}
      {activeCourseId && !loading && !error && grades.length ? (
        <>
          <div className="stats-grid" style={{ marginBottom: 20 }}>
            <div className="stat-card accent-teal"><div className="stat-label">Total graded</div><div className="stat-value">{grades.length}</div></div>
            <div className="stat-card accent-teal"><div className="stat-label">Passed</div><div className="stat-value">{stats.passed}</div></div>
            <div className="stat-card accent-danger"><div className="stat-label">Failed</div><div className="stat-value">{stats.failed}</div></div>
            <div className="stat-card accent-navy"><div className="stat-label">Average score</div><div className="stat-value">{stats.average.toFixed(1)}</div></div>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Score</th>
                  <th>Result</th>
                  <th>Notes</th>
                  <th>Graded on</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {grades.map((grade) => {
                  const student = grade.enrollment_id?.student_id || {};
                  return (
                    <tr key={grade._id || grade.id}>
                      <td className="td-name">{student.full_name || "-"}</td>
                      <td>{grade.grade_value ?? "-"}</td>
                      <td><StatusBadge status={grade.result} /></td>
                      <td className="td-muted">{grade.notes || "-"}</td>
                      <td className="td-muted">{formatDate(grade.created_at)}</td>
                      <td><button type="button" className="btn btn-ghost btn-sm" onClick={() => openModal(grade)}>Edit</button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      ) : null}

      <Modal
        open={!!editing}
        title={editing ? `Edit Grade - ${editing.enrollment_id?.student_id?.full_name || "Student"}` : ""}
        onClose={() => setEditing(null)}
        footer={
          <>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setEditing(null)}>Cancel</button>
            <button type="button" className="btn btn-primary btn-sm" onClick={saveGrade}>Update grade</button>
          </>
        }
      >
        <div className="form-group">
          <label className="form-label">Score</label>
          <input className="form-input" type="number" value={form.grade_value} onChange={(e) => setForm((c) => ({ ...c, grade_value: e.target.value }))} />
        </div>
        <div className="form-group">
          <label className="form-label">Result</label>
          <select className="form-select" value={form.result} onChange={(e) => setForm((c) => ({ ...c, result: e.target.value }))}>
            <option value="PASSED">Passed</option>
            <option value="FAILED">Failed</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Notes</label>
          <textarea className="form-textarea" value={form.notes} onChange={(e) => setForm((c) => ({ ...c, notes: e.target.value }))} />
        </div>
      </Modal>
    </AppShell>
  );
}
