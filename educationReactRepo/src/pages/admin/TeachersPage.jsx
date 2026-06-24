import { useEffect, useMemo, useState } from "react";
import { AppShell } from "../../components/layout/AppShell";
import { Modal } from "../../components/ui/Modal";
import { EmptyState, LoadingState } from "../../components/ui/PageState";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { api } from "../../lib/api/client";
import { toArray } from "../../lib/ui/format";

function teacherIsActive(teacher) {
  return teacher.active !== false && teacher.isActive !== false && (teacher.status || "active").toLowerCase() !== "inactive";
}

export function TeachersPage() {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("");
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ full_name: "", email: "", phone: "", password: "" });
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadTeachers();
  }, []);

  async function loadTeachers() {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/admin/teachers");
      setTeachers(toArray(res, ["data", "teachers"]));
    } catch (loadError) {
      setError(loadError.message || "Couldn't load teachers.");
    } finally {
      setLoading(false);
    }
  }

  const filteredTeachers = useMemo(() => {
    return teachers.filter((teacher) => {
      const name = (teacher.full_name || teacher.name || "").toLowerCase();
      const email = (teacher.email || "").toLowerCase();
      const isActive = teacherIsActive(teacher);
      return (!search || name.includes(search.toLowerCase()) || email.includes(search.toLowerCase()))
        && (activeFilter === "" || (activeFilter === "true" ? isActive : !isActive));
    });
  }, [teachers, search, activeFilter]);

  function openModal(teacher) {
    setEditing(teacher || {});
    setForm({
      full_name: teacher?.full_name || teacher?.name || "",
      email: teacher?.email || "",
      phone: teacher?.phone || "",
      password: "",
    });
    setFormError("");
  }

  async function saveTeacher() {
    if (!form.full_name.trim() || !form.email.trim()) {
      setFormError("Name and email are required.");
      return;
    }
    if (!(editing?._id || editing?.id) && form.password.length < 8) {
      setFormError("Password must be at least 8 characters.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
      };
      if (editing?._id || editing?.id) {
        await api.put(`/admin/teachers/${editing._id || editing.id}`, payload);
      } else {
        await api.post("/admin/teachers", { ...payload, password: form.password, role: "teacher" });
      }
      setEditing(null);
      await loadTeachers();
    } catch (saveError) {
      setFormError(saveError.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleTeacher(teacher) {
    const id = teacher._id || teacher.id;
    const active = teacherIsActive(teacher);
    await api.put(`/admin/teachers/${id}`, {
      status: active ? "INACTIVE" : "ACTIVE",
    });
    await loadTeachers();
  }

  return (
    <AppShell
      title="Teachers"
      actions={
        <button type="button" className="btn btn-primary btn-sm" onClick={() => openModal(null)}>
          Add teacher
        </button>
      }
    >
      <div className="page-header">
        <div>
          <h1>Manage Teachers</h1>
          <p>Add instructors, update their profiles, or deactivate accounts.</p>
        </div>
      </div>

      <div className="filters-bar">
        <input className="form-input" placeholder="Search by name or email..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="form-select" value={activeFilter} onChange={(e) => setActiveFilter(e.target.value)}>
          <option value="">All teachers</option>
          <option value="true">Active</option>
          <option value="false">Deactivated</option>
        </select>
      </div>

      {loading ? <LoadingState message="Loading teachers..." /> : null}
      {!loading && error ? <EmptyState title="Couldn't load teachers" message={error} /> : null}
      {!loading && !error && !filteredTeachers.length ? (
        <EmptyState title="No teachers found" message="Add your first instructor to start assigning courses." />
      ) : null}
      {!loading && !error && filteredTeachers.length ? (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTeachers.map((teacher) => {
                const active = teacherIsActive(teacher);
                return (
                  <tr key={teacher._id || teacher.id}>
                    <td className="td-name">{teacher.full_name || teacher.name || "-"}</td>
                    <td className="td-muted">{teacher.email || "-"}</td>
                    <td className="td-muted">{teacher.phone || "-"}</td>
                    <td><StatusBadge status={active ? "ACTIVE" : "INACTIVE"} /></td>
                    <td>
                      <div className="td-actions">
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => openModal(teacher)}>Edit</button>
                        <button type="button" className={`btn btn-sm ${active ? "btn-danger" : "btn-secondary"}`} onClick={() => toggleTeacher(teacher)}>
                          {active ? "Deactivate" : "Reactivate"}
                        </button>
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
        title={editing?._id || editing?.id ? "Edit Teacher" : "Add Teacher"}
        onClose={() => setEditing(null)}
        footer={
          <>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setEditing(null)}>Cancel</button>
            <button type="button" className="btn btn-primary btn-sm" onClick={saveTeacher} disabled={saving}>
              {saving ? "Saving..." : editing?._id || editing?.id ? "Save changes" : "Create account"}
            </button>
          </>
        }
      >
        <div className="form-group">
          <label className="form-label">Full name</label>
          <input className="form-input" value={form.full_name} onChange={(e) => setForm((c) => ({ ...c, full_name: e.target.value }))} />
        </div>
        <div className="form-group">
          <label className="form-label">Email</label>
          <input className="form-input" value={form.email} readOnly={!!(editing?._id || editing?.id)} onChange={(e) => setForm((c) => ({ ...c, email: e.target.value }))} />
        </div>
        <div className="form-group">
          <label className="form-label">Phone</label>
          <input className="form-input" value={form.phone} onChange={(e) => setForm((c) => ({ ...c, phone: e.target.value }))} />
        </div>
        {!(editing?._id || editing?.id) ? (
          <div className="form-group">
            <label className="form-label">Temporary password</label>
            <input className="form-input" type="password" value={form.password} onChange={(e) => setForm((c) => ({ ...c, password: e.target.value }))} />
          </div>
        ) : null}
        {formError ? <div className="rejection-note">{formError}</div> : null}
      </Modal>
    </AppShell>
  );
}
