import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AppShell } from "../../components/layout/AppShell";
import { EmptyState, LoadingState } from "../../components/ui/PageState";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { api } from "../../lib/api/client";
import { formatDate, toArray } from "../../lib/ui/format";

const filters = ["all", "PENDING", "ACCEPTED", "REJECTED", "CANCELLED"];

export function StudentCoursesPage() {
  const [activeStatus, setActiveStatus] = useState("all");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadCourses();
  }, [activeStatus]);

  async function loadCourses() {
    setLoading(true);
    setError("");
    try {
      const url = activeStatus === "all" ? "/students/me/courses?status=all" : `/students/me/courses?status=${activeStatus}`;
      const res = await api.get(url);
      setItems(toArray(res, ["data", "enrollments"]));
    } catch (loadError) {
      setError(loadError.message || "Couldn't load courses.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell
      title="My Courses"
      actions={<Link to="/student/browse" className="btn btn-primary btn-sm">Browse courses</Link>}
    >
      <div className="page-header">
        <div>
          <h1>My Enrollments</h1>
          <p>Track the status of your course enrollments.</p>
        </div>
      </div>

      <div className="filter-chips" style={{ marginBottom: 20 }}>
        {filters.map((status) => (
          <button key={status} type="button" className={`chip${activeStatus === status ? " active" : ""}`} onClick={() => setActiveStatus(status)}>
            {status}
          </button>
        ))}
      </div>

      {loading ? <LoadingState message="Loading your courses..." /> : null}
      {!loading && error ? <EmptyState title="Couldn't load courses" message={error} /> : null}
      {!loading && !error && !items.length ? (
        <EmptyState title="No enrollments yet" message="You haven't requested enrollment in any course yet." action={<Link to="/student/browse" className="btn btn-primary btn-sm">Browse courses</Link>} />
      ) : null}
      {!loading && !error && items.length ? (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Course</th>
                <th>Category</th>
                <th>Enrolled on</th>
                <th>Status</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const course = item.course_id || item.course || {};
                const status = (item.status || "").toUpperCase();
                return (
                  <tr key={item._id || item.id}>
                    <td className="td-name">{course.title || item.courseTitle || "-"}</td>
                    <td className="td-muted">{course.category_id?.name || "-"}</td>
                    <td className="td-muted">{formatDate(item.created_at || item.createdAt || item.enrolled_at)}</td>
                    <td><StatusBadge status={status} /></td>
                    <td className="td-muted">{status === "REJECTED" ? item.rejection_reason || item.rejectionReason || "-" : "-"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}
    </AppShell>
  );
}
