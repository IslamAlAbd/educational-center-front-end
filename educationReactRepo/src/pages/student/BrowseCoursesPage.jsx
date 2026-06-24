import { useEffect, useMemo, useState } from "react";
import { AppShell } from "../../components/layout/AppShell";
import { EmptyState, LoadingState } from "../../components/ui/PageState";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { api } from "../../lib/api/client";
import { formatPrice, toArray } from "../../lib/ui/format";

export function BrowseCoursesPage() {
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [categoriesRes, coursesRes] = await Promise.allSettled([
        api.get("/categories"),
        api.get("/courses"),
      ]);
      if (categoriesRes.status === "fulfilled") {
        setCategories(toArray(categoriesRes.value, ["data"]));
      }
      if (coursesRes.status === "fulfilled") {
        setCourses(toArray(coursesRes.value, ["data", "courses"]));
        setError("");
      } else {
        setError(coursesRes.reason?.message || "Couldn't load courses.");
      }
    } finally {
      setLoading(false);
    }
  }

  const filteredCourses = useMemo(() => {
    let list = courses.filter((course) => {
      const title = (course.title || course.name || "").toLowerCase();
      const courseCategory = course.category?._id || course.category?.id || course.category_id?._id || course.category_id || "";
      return (!search || title.includes(search.toLowerCase())) && (!category || category === courseCategory);
    });

    if (sort === "price_asc") list = [...list].sort((a, b) => (a.price || 0) - (b.price || 0));
    if (sort === "price_desc") list = [...list].sort((a, b) => (b.price || 0) - (a.price || 0));
    return list;
  }, [courses, search, category, sort]);

  async function requestEnrollment(course) {
    const confirmed = window.confirm(`Request enrollment in "${course.title || course.name}"?`);
    if (!confirmed) return;
    await api.post(`/courses/${course._id || course.id}/enrollments`);
  }

  return (
    <AppShell title="Browse Courses">
      <div className="page-header">
        <div>
          <h1>Course Catalogue</h1>
          <p>Find a course and request enrollment to get started.</p>
        </div>
      </div>

      <div className="filters-bar">
        <input className="form-input" placeholder="Search courses..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="form-select" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">All categories</option>
          {categories.map((item) => (
            <option key={item._id || item.id} value={item._id || item.id}>{item.name}</option>
          ))}
        </select>
        <select className="form-select" value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="">Default sort</option>
          <option value="price_asc">Price: low to high</option>
          <option value="price_desc">Price: high to low</option>
        </select>
      </div>

      {loading ? <LoadingState message="Loading courses..." /> : null}
      {!loading && error ? <EmptyState title="Couldn't load courses" message={error} /> : null}
      {!loading && !error && !filteredCourses.length ? (
        <EmptyState title="No courses found" message="Try adjusting your search or category filter." />
      ) : null}
      {!loading && !error && filteredCourses.length ? (
        <div className="courses-grid">
          {filteredCourses.map((course) => {
            const status = (course.status || "").toUpperCase();
            const teacher = course.teacher?.full_name || course.teacher_id?.full_name || course.teacherName || "-";
            const categoryName = course.category?.name || course.category_id?.name || course.categoryName || "General";
            return (
              <div key={course._id || course.id} className="course-card">
                <div className="course-card-header">
                  <div className="course-card-cat">{categoryName}</div>
                  <div className="course-card-title">{course.title || course.name || "Untitled Course"}</div>
                </div>
                <div className="course-card-body">
                  <div className="course-meta">
                    <div className="course-meta-item">{teacher}</div>
                    {course.schedule ? <div className="course-meta-item">{course.schedule}</div> : null}
                  </div>
                  <div className="course-price">{formatPrice(course.price) || "Free"}</div>
                </div>
                <div className="course-card-footer">
                  <StatusBadge status={status} />
                  {status !== "INACTIVE" ? (
                    <button type="button" className="btn btn-primary btn-sm" onClick={() => requestEnrollment(course)}>
                      Request enrollment
                    </button>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      ) : null}
    </AppShell>
  );
}
