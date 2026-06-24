import { useEffect, useState } from "react";
import { AppShell } from "../../components/layout/AppShell";
import { EmptyState, LoadingState } from "../../components/ui/PageState";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { api } from "../../lib/api/client";
import { toArray } from "../../lib/ui/format";

export function StudentGradesPage() {
  const [enrollments, setEnrollments] = useState([]);
  const [grades, setGrades] = useState([]);
  const [selectedEnrollment, setSelectedEnrollment] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadEnrollments();
  }, []);

  useEffect(() => {
    loadGrades();
  }, [selectedEnrollment]);

  async function loadEnrollments() {
    try {
      const res = await api.get("/students/me/courses?status=ACCEPTED");
      setEnrollments(toArray(res, ["data", "enrollments"]));
    } catch {
      setEnrollments([]);
    }
  }

  async function loadGrades() {
    setLoading(true);
    setError("");
    try {
      const url = selectedEnrollment ? `/students/me/grades?enrollmentId=${selectedEnrollment}` : "/students/me/grades";
      const res = await api.get(url);
      setGrades(toArray(res, ["data", "grades"]));
    } catch (loadError) {
      setError(loadError.message || "Couldn't load grades.");





    } finally {
      setLoading(false);
    }
  }

  const average = grades.length
    ? grades.reduce((sum, item) => sum + (item.grade_value || item.gradeValue || item.value || 0), 0) / grades.length
    : 0;

  return (
    <AppShell title="My Grades">
      <div className="page-header">
        <div>
          <h1>My Grades</h1>
          <p>Review your assessed results across all courses.</p>
        </div>
      </div>

      <div className="filters-bar">
        <label htmlFor="enrollment-filter">Filter by course:</label>
        <select id="enrollment-filter" className="form-select" value={selectedEnrollment} onChange={(e) => setSelectedEnrollment(e.target.value)}>
          <option value="">All courses</option>
          {enrollments.map((enrollment) => (
            <option key={enrollment._id || enrollment.id} value={enrollment._id || enrollment.id}>
              {enrollment.course?.title || enrollment.course_id?.title || enrollment.courseTitle || "Course"}
            </option>
          ))}
        </select>
      </div>

      {loading ? <LoadingState message="Loading grades..." /> : null}
      {!loading && error ? <EmptyState title="Couldn't load grades" message={error} /> : null}
      {!loading && !error && !grades.length ? <EmptyState title="No grades yet" message="Your grades will appear here once your instructor has assessed your enrollment." /> : null}
      {!loading && !error && grades.length ? (
        <>
          <div className="stats-grid" style={{ marginBottom: 20 }}>
            <div className="stat-card accent-teal"><div className="stat-label">Grades received</div><div className="stat-value">{grades.length}</div></div>
            <div className="stat-card accent-navy"><div className="stat-label">Average score</div><div className="stat-value">{average.toFixed(1)}</div></div>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Course</th>
                  <th>Score</th>
                  <th>Result</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {grades.map((grade) => {
                  const course = grade.enrollment?.course || grade.course || {};
                  return (
                    <tr key={grade._id || grade.id}>
                      <td className="td-name">{course.title || grade.courseTitle || "-"}</td>
                      <td>{grade.grade_value ?? grade.gradeValue ?? grade.value ?? "-"}</td>
                      <td><StatusBadge status={(grade.result || "").toUpperCase()} /></td>
                      <td className="td-muted">{grade.notes || grade.feedback || "-"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      ) : null}
    </AppShell>
  );
}
