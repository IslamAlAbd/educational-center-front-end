import { useEffect, useState } from "react";
import { AppShell } from "../../components/layout/AppShell";
import { Modal } from "../../components/ui/Modal";
import { EmptyState, LoadingState } from "../../components/ui/PageState";
import { api } from "../../lib/api/client";
import { formatDate, toArray } from "../../lib/ui/format";

export function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", description: "" });
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  async function loadCategories() {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/categories", true);
      setCategories(toArray(res, ["data", "categories"]));
    } catch (loadError) {
      setError(loadError.message || "Couldn't load categories.");
    } finally {
      setLoading(false);
    }
  }

  function openModal(category) {
    setEditing(category || {});
    setForm({
      name: category?.name || "",
      description: category?.description || category?.desc || "",
    });
    setFormError("");
  }

  async function handleSave() {
    if (!form.name.trim()) {
      setFormError("Name is required.");
      return;
    }

    setSaving(true);
    try {
      const payload = { name: form.name.trim(), description: form.description.trim() };
      if (editing?._id || editing?.id) {
        await api.patch(`/categories/${editing._id || editing.id}`, payload);
      } else {
        await api.post("/categories", payload);
      }
      setEditing(null);
      await loadCategories();
    } catch (saveError) {
      setFormError(saveError.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(category) {
    const confirmed = window.confirm(`Delete category "${category.name}"?`);
    if (!confirmed) return;
    await api.delete(`/categories/${category._id || category.id}`);
    await loadCategories();
  }

  return (
    <AppShell
      title="Categories"
      actions={
        <button type="button" className="btn btn-primary btn-sm" onClick={() => openModal(null)}>
          Add category
        </button>
      }
    >
      <div className="page-header">
        <div>
          <h1>Course Categories</h1>
          <p>Organise your course catalogue into meaningful groups.</p>
        </div>
      </div>

      {loading ? <LoadingState message="Loading categories..." /> : null}
      {!loading && error ? <EmptyState title="Couldn't load categories" message={error} /> : null}
      {!loading && !error && !categories.length ? (
        <EmptyState
          title="No categories yet"
          message="Create your first category to start organising courses."
          action={
            <button type="button" className="btn btn-primary btn-sm" onClick={() => openModal(null)}>
              Add category
            </button>
          }
        />
      ) : null}
      {!loading && !error && categories.length ? (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Description</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => (
                <tr key={category._id || category.id}>
                  <td className="td-name">{category.name || "-"}</td>
                  <td className="td-muted">{category.description || category.desc || "No description"}</td>
                  <td className="td-muted">{formatDate(category.created_at || category.createdAt)}</td>
                  <td>
                    <div className="td-actions">
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => openModal(category)}>
                        Edit
                      </button>
                      <button type="button" className="btn btn-danger btn-sm" onClick={() => handleDelete(category)}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      <Modal
        open={editing !== null}
        title={editing?._id || editing?.id ? "Edit Category" : "Add Category"}
        onClose={() => setEditing(null)}
        footer={
          <>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setEditing(null)}>
              Cancel
            </button>
            <button type="button" className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : editing?._id || editing?.id ? "Save changes" : "Create"}
            </button>
          </>
        }
      >
        <div className="form-group">
          <label className="form-label" htmlFor="cat-name">Name</label>
          <input
            id="cat-name"
            className="form-input"
            value={form.name}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
          />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="cat-desc">Description</label>
          <textarea
            id="cat-desc"
            className="form-textarea"
            value={form.description}
            onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
          />
        </div>
        {formError ? <div className="rejection-note">{formError}</div> : null}
      </Modal>
    </AppShell>
  );
}
