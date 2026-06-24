import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AppShell } from "../../components/layout/AppShell";
import { EmptyState, LoadingState } from "../../components/ui/PageState";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { api } from "../../lib/api/client";
import { toArray } from "../../lib/ui/format";

export function TeacherCoursesPage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadCourses();
  }, []);

  async function loadCourses() {
    setLoading(true);
    try {
      const res = await api.get("/teachers/me/courses");
      setCourses(toArray(res, ["data"]));
      setError("");
    } catch (loadError) {
      setError(loadError.message || "Couldn't load courses.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell title="My Courses">
      <div className="page-header">
        <div>
          <h1>My Courses</h1>
          <p>Courses you are currently assigned to teach.</p>
        </div>
      </div>

      {loading ? <LoadingState message="Loading your courses..." /> : null}
      {!loading && error ? <EmptyState title="Couldn't load courses" message={error} /> : null}
      {!loading && !error && !courses.length ? <EmptyState title="No courses assigned" message="You haven't been assigned to teach any courses yet." /> : null}
      {!loading && !error && courses.length ? (
        <div className="courses-grid">
          {courses.map((course) => (
            <div key={course._id || course.id} className="course-card">
              <div className="course-card-header">
                <div className="course-card-cat">{course.category_id?.name || "General"}</div>
                <div className="course-card-title">{course.title || "Untitled"}</div>
              </div>
              <div className="course-card-body">
                <div className="course-meta">
                  {course.schedule ? <div className="course-meta-item">{course.schedule}</div> : null}
                  <div className="course-meta-item">{course.enrolled_count ?? 0} enrolled</div>
                </div>
                <StatusBadge status={(course.status || "available").toUpperCase()} />
              </div>
              <div className="course-card-footer">
                <Link to={`/teacher/courses/${course._id || course.id}`} className="btn btn-primary btn-sm">View roster</Link>
                <Link to={`/teacher/grades?courseId=${course._id || course.id}`} className="btn btn-secondary btn-sm">All grades</Link>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </AppShell>
  );
}
