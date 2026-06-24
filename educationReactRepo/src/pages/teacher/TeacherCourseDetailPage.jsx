import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AppShell } from "../../components/layout/AppShell";
import { Modal } from "../../components/ui/Modal";
import { EmptyState, LoadingState } from "../../components/ui/PageState";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { api } from "../../lib/api/client";
import { formatDate, toArray } from "../../lib/ui/format";

export function TeacherCourseDetailPage() {
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ grade_value: "", result: "PASSED", notes: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadRoster();
  }, [courseId]);

  const gradesByEnrollment = useMemo(() => {
    return grades.reduce((accumulator, grade) => {
      const id = grade.enrollment_id?._id || grade.enrollment_id;
      if (id) accumulator[id] = grade;
      return accumulator;
    }, {});
  }, [grades]);

  async function loadRoster() {
    setLoading(true);
    try {
      const [courseRes, studentsRes, gradesRes] = await Promise.all([
        api.get(`/courses/${courseId}`),
        api.get(`/teachers/me/courses/${courseId}/students`),
        api.get(`/teachers/me/courses/${courseId}/grades`),
      ]);
      setCourse(courseRes?.data || courseRes);
      setEnrollments(toArray(studentsRes, ["data"]));
      setGrades(toArray(gradesRes, ["data"]));
      setError("");
    } catch (loadError) {
      setError(loadError.message || "Couldn't load roster.");
    } finally {
      setLoading(false);
    }
  }

  function openGradeModal(enrollment) {
    const current = gradesByEnrollment[enrollment._id] || {};
    setEditing(enrollment);
    setForm({
      grade_value: current.grade_value ?? "",
      result: (current.result || "PASSED").toUpperCase(),
      notes: current.notes || "",
    });
  }

  async function saveGrade() {
    if (form.grade_value === "") return;
    setSaving(true);
    const existing = gradesByEnrollment[editing._id];
    const payload = {
      grade_value: parseFloat(form.grade_value),
      result: form.result,
      notes: form.notes.trim() || undefined,
    };
    try {
      if (existing?._id || existing?.id) {
        await api.put(`/teachers/me/grades/${existing._id || existing.id}`, payload);
      } else {
        await api.post(`/teachers/me/courses/${courseId}/enrollments/${editing._id}/grade`, payload);
      }
      setEditing(null);
      await loadRoster();
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell title={course?.title || "Course Roster"} actions={<Link to="/teacher/courses" className="btn btn-secondary btn-sm">Back to courses</Link>}>
      <div className="page-header">
        <div>
          <h1>{course?.title || "Course Roster"}</h1>
          <p>{course?.schedule || "Review enrolled students and manage grades."}</p>
        </div>
        <div className="page-header-actions">
          <Link to={`/teacher/grades?courseId=${courseId}`} className="btn btn-secondary btn-sm">View all grades</Link>
        </div>
      </div>

      {loading ? <LoadingState message="Loading students..." /> : null}
      {!loading && error ? <EmptyState title="Couldn't load roster" message={error} /> : null}
      {!loading && !error && !enrollments.length ? <EmptyState title="No enrolled students" message="No students have been accepted into this course yet." /> : null}
      {!loading && !error && enrollments.length ? (
        <>
          <div className="stats-grid" style={{ marginBottom: 20 }}>
            <div className="stat-card accent-teal"><div className="stat-label">Students enrolled</div><div className="stat-value">{enrollments.length}</div></div>
            <div className="stat-card accent-navy"><div className="stat-label">Graded</div><div className="stat-value">{enrollments.filter((item) => !!gradesByEnrollment[item._id]).length}</div></div>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Email</th>
                  <th>Enrolled on</th>
                  <th>Score</th>
                  <th>Result</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {enrollments.map((enrollment) => {
                  const student = enrollment.student_id || {};
                  const grade = gradesByEnrollment[enrollment._id];
                  return (
                    <tr key={enrollment._id}>
                      <td className="td-name">{student.full_name || "-"}</td>
                      <td className="td-muted">{student.email || "-"}</td>
                      <td className="td-muted">{formatDate(enrollment.accepted_at || enrollment.requested_at)}</td>
                      <td>{grade?.grade_value ?? "-"}</td>
                      <td>{grade ? <StatusBadge status={grade.result} /> : "-"}</td>
                      <td><button type="button" className={`btn btn-sm ${grade ? "btn-secondary" : "btn-primary"}`} onClick={() => openGradeModal(enrollment)}>{grade ? "Edit grade" : "Add grade"}</button></td>
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
        title={editing ? `Grade ${editing.student_id?.full_name || "Student"}` : ""}
        onClose={() => setEditing(null)}
        footer={
          <>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setEditing(null)}>Cancel</button>
            <button type="button" className="btn btn-primary btn-sm" onClick={saveGrade} disabled={saving}>{saving ? "Saving..." : "Save grade"}</button>
          </>
        }
      >
        <div className="form-group">
          <label className="form-label">Score</label>
          <input className="form-input" type="number" min="0" max="100" value={form.grade_value} onChange={(e) => setForm((c) => ({ ...c, grade_value: e.target.value }))} />
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
