import { useEffect, useMemo, useState } from "react";
import { AppShell } from "../../components/layout/AppShell";
import { Modal } from "../../components/ui/Modal";
import { EmptyState, LoadingState } from "../../components/ui/PageState";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { api } from "../../lib/api/client";
import { formatPrice, toArray } from "../../lib/ui/format";

const defaultCourseForm = {
  title: "",
  price: "",
  category_id: "",
  teacher_id: "",
  capacity: "",
  status: "available",
  schedule: "",
  description: "",
};

export function CoursesPage() {
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(defaultCourseForm);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [catsRes, teachersRes, coursesRes] = await Promise.allSettled([
        api.get("/categories", true),
        api.get("/admin/teachers"),
        api.get("/courses"),
      ]);
      if (catsRes.status === "fulfilled") setCategories(toArray(catsRes.value, ["data"]));
      if (teachersRes.status === "fulfilled") setTeachers(toArray(teachersRes.value, ["data"]));
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
    return courses.filter((course) => {
      const title = (course.title || course.name || "").toLowerCase();
      const categoryId = course.category_id?._id || course.category_id || "";
      const status = (course.status || "").toUpperCase();
      return (!search || title.includes(search.toLowerCase()))
        && (!categoryFilter || categoryId === categoryFilter)
        && (!statusFilter || status === statusFilter);
    });
  }, [courses, search, categoryFilter, statusFilter]);

  function openModal(course) {
    setEditing(course || {});
    setForm({
      title: course?.title || course?.name || "",
      price: course?.price ?? "",
      category_id: course?.category_id?._id || course?.category_id || "",
      teacher_id: course?.teacher_id?._id || course?.teacher_id || "",
      capacity: course?.capacity ?? "",
      status: course?.status?.toLowerCase() || "available",
      schedule: course?.schedule || "",
      description: course?.description || "",
    });
    setFormError("");
  }

  async function saveCourse() {
    if (!form.title.trim()) {
      setFormError("Title is required.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        status: form.status,
        description: form.description.trim(),
        schedule: form.schedule.trim(),
      };
      if (form.price !== "") payload.price = parseFloat(form.price);
      if (form.category_id) payload.category_id = form.category_id;
      if (form.teacher_id) payload.teacher_id = form.teacher_id;
      if (form.capacity !== "") payload.capacity = parseInt(form.capacity, 10);
      if (editing?._id || editing?.id) {
        await api.put(`/courses/${editing._id || editing.id}`, payload);
      } else {
        await api.post("/courses", payload);
      }
      setEditing(null);
      setForm(defaultCourseForm);
      await loadData();
    } catch (saveError) {
      setFormError(saveError.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  async function changeStatus(course, status) {
    await api.patch(`/courses/${course._id || course.id}/status`, { status });
    await loadData();
  }

  async function deleteCourse(course) {
    const confirmed = window.confirm(`Delete course "${course.title || course.name}"?`);
    if (!confirmed) return;
    await api.delete(`/courses/${course._id || course.id}`);
    await loadData();
  }

  return (
    <AppShell
      title="Courses"
      actions={<button type="button" className="btn btn-primary btn-sm" onClick={() => openModal(null)}>Add course</button>}
    >
      <div className="page-header">
        <div>
          <h1>Manage Courses</h1>
          <p>Create, edit, and control the status of every course in the catalogue.</p>
        </div>
      </div>

      <div className="filters-bar">
        <input className="form-input" placeholder="Search by title..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="form-select" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
          <option value="">All categories</option>
          {categories.map((category) => (
            <option key={category._id || category.id} value={category._id || category.id}>{category.name}</option>
          ))}
        </select>
        <select className="form-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          <option value="AVAILABLE">Available</option>
          <option value="FULL">Full</option>
          <option value="FINISHED">Finished</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      {loading ? <LoadingState message="Loading courses..." /> : null}
      {!loading && error ? <EmptyState title="Couldn't load courses" message={error} /> : null}
      {!loading && !error && !filteredCourses.length ? <EmptyState title="No courses found" message="Try adjusting your filters or add a new course." /> : null}
      {!loading && !error && filteredCourses.length ? (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Category</th>
                <th>Teacher</th>
                <th>Price</th>
                <th>Seats</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCourses.map((course) => {
                const id = course._id || course.id;
                return (
                  <tr key={id}>
                    <td className="td-name">{course.title || course.name || "-"}</td>
                    <td className="td-muted">{course.category_id?.name || "-"}</td>
                    <td className="td-muted">{course.teacher_id?.full_name || "-"}</td>
                    <td>{course.price != null ? formatPrice(course.price) : "Free"}</td>
                    <td>{course.capacity ?? "-"}</td>
                    <td><StatusBadge status={(course.status || "AVAILABLE").toUpperCase()} /></td>
                    <td>
                      <div className="td-actions">
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => openModal(course)}>Edit</button>
                        <select className="form-select" value={(course.status || "AVAILABLE").toUpperCase()} onChange={(e) => changeStatus(course, e.target.value)}>
                          <option value="AVAILABLE">Available</option>
                          <option value="FULL">Full</option>
                          <option value="FINISHED">Finished</option>
                          <option value="CANCELLED">Cancelled</option>
                        </select>
                        <button type="button" className="btn btn-danger btn-sm" onClick={() => deleteCourse(course)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}

      <Modal
        open={editing !== null}
        title={editing?._id || editing?.id ? "Edit Course" : "Add Course"}
        onClose={() => setEditing(null)}
        wide
        footer={
          <>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setEditing(null)}>Cancel</button>
            <button type="button" className="btn btn-primary btn-sm" onClick={saveCourse} disabled={saving}>{saving ? "Saving..." : editing?._id || editing?.id ? "Save changes" : "Create course"}</button>
          </>
        }
      >
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Title</label>
            <input className="form-input" value={form.title} onChange={(e) => setForm((c) => ({ ...c, title: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Price</label>
            <input className="form-input" type="number" value={form.price} onChange={(e) => setForm((c) => ({ ...c, price: e.target.value }))} />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Category</label>
            <select className="form-select" value={form.category_id} onChange={(e) => setForm((c) => ({ ...c, category_id: e.target.value }))}>
              <option value="">Select category</option>
              {categories.map((category) => <option key={category._id || category.id} value={category._id || category.id}>{category.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Teacher</label>
            <select className="form-select" value={form.teacher_id} onChange={(e) => setForm((c) => ({ ...c, teacher_id: e.target.value }))}>
              <option value="">Unassigned</option>
              {teachers.map((teacher) => <option key={teacher._id || teacher.id} value={teacher._id || teacher.id}>{teacher.full_name || teacher.email}</option>)}
            </select>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Seats</label>
            <input className="form-input" type="number" value={form.capacity} onChange={(e) => setForm((c) => ({ ...c, capacity: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Status</label>
            <select className="form-select" value={form.status} onChange={(e) => setForm((c) => ({ ...c, status: e.target.value }))}>
              <option value="available">Available</option>
              <option value="full">Full</option>
              <option value="completed">Completed</option>
              <option value="finished">Finished</option>
              <option value="cancelled">Cancelled</option>
              <option value="upcoming">Upcoming</option>
            </select>
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Schedule</label>
          <input className="form-input" value={form.schedule} onChange={(e) => setForm((c) => ({ ...c, schedule: e.target.value }))} />
        </div>
        <div className="form-group">
          <label className="form-label">Description</label>
          <textarea className="form-textarea" value={form.description} onChange={(e) => setForm((c) => ({ ...c, description: e.target.value }))} />
        </div>
        {formError ? <div className="rejection-note">{formError}</div> : null}
      </Modal>
    </AppShell>
  );
}
