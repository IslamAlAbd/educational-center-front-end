import { useEffect, useMemo, useState } from "react";
import { AppShell } from "../../components/layout/AppShell";
import { Modal } from "../../components/ui/Modal";
import { EmptyState, LoadingState } from "../../components/ui/PageState";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { api } from "../../lib/api/client";
import { formatDate, toArray } from "../../lib/ui/format";

export function EnrollmentsPage() {
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [rejecting, setRejecting] = useState(null);
  const [reason, setReason] = useState("");

  useEffect(() => {
    loadCourses();
  }, []);

  useEffect(() => {
    if (selectedCourseId) {
      loadEnrollments();
    } else {
      setEnrollments([]);
    }
  }, [selectedCourseId, statusFilter]);

  async function loadCourses() {
    const res = await api.get("/courses");
    setCourses(toArray(res, ["data", "courses"]));
  }

  async function loadEnrollments() {
    setLoading(true);
    try {
      const url = statusFilter
        ? `/admin/courses/${selectedCourseId}/enrollments?status=${statusFilter}`
        : `/admin/courses/${selectedCourseId}/enrollments`;
      const res = await api.get(url);
      setEnrollments(toArray(res, ["data", "enrollments"]));
      setError("");
    } catch (loadError) {
      setError(loadError.message || "Couldn't load enrollments.");
    } finally {
      setLoading(false);
    }
  }

  const pendingCount = useMemo(
    () => enrollments.filter((item) => (item.status || "").toUpperCase() === "PENDING_PAYMENT").length,
    [enrollments],
  );

  async function processEnrollment(enrollmentId, status, rejectionReason) {
    const payload = { status };
    if (rejectionReason) payload.rejection_reason = rejectionReason;
    await api.post(`/admin/enrollments/${enrollmentId}`, payload);
    setRejecting(null);
    setReason("");
    await loadEnrollments();
  }

  return (
    <AppShell title="Enrollments">
      <div className="page-header">
        <div>
          <h1>Enrollment Requests</h1>
          <p>Select a course to review, accept, or reject student enrollment requests.</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-body" style={{ padding: "18px 22px" }}>
          <div className="filters-bar">
            <select className="form-select" value={selectedCourseId} onChange={(e) => setSelectedCourseId(e.target.value)}>
              <option value="">Choose a course to review</option>
              {courses.map((course) => (
                <option key={course._id || course.id} value={course._id || course.id}>{course.title || course.name || course._id || course.id}</option>
              ))}
            </select>
            <div className="filter-chips">
              {["", "PENDING_PAYMENT", "ACCEPTED", "REJECTED"].map((status) => (
                <button key={status || "all"} type="button" className={`chip${statusFilter === status ? " active" : ""}`} onClick={() => setStatusFilter(status)}>
                  {status || "All"}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {!selectedCourseId ? <EmptyState title="Select a course above" message="Enrollment requests for the selected course will appear here." /> : null}
      {selectedCourseId && loading ? <LoadingState message="Loading enrollments..." /> : null}
      {selectedCourseId && !loading && error ? <EmptyState title="Couldn't load enrollments" message={error} /> : null}
      {selectedCourseId && !loading && !error && !enrollments.length ? <EmptyState title="No enrollment requests" message="No requests found for this selection." /> : null}
      {selectedCourseId && !loading && !error && enrollments.length ? (
        <>
          {pendingCount ? <div className="info-box" style={{ marginBottom: 16 }}><strong>{pendingCount}</strong> pending requests awaiting review.</div> : null}
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Email</th>
                  <th>Requested</th>
                  <th>Status</th>
                  <th>Rejection reason</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {enrollments.map((enrollment) => {
                  const student = enrollment.student_id || {};
                  const status = (enrollment.status || "").toUpperCase();
                  return (
                    <tr key={enrollment._id || enrollment.id}>
                      <td className="td-name">{student.full_name || "-"}</td>
                      <td className="td-muted">{student.email || "-"}</td>
                      <td className="td-muted">{formatDate(enrollment.created_at || enrollment.createdAt || enrollment.requested_at)}</td>
                      <td><StatusBadge status={status} /></td>
                      <td className="td-muted">{enrollment.rejection_reason || enrollment.rejectionReason || "-"}</td>
                      <td>
                        {status === "PENDING_PAYMENT" ? (
                          <div className="td-actions">
                            <button type="button" className="btn btn-primary btn-sm" onClick={() => processEnrollment(enrollment._id || enrollment.id, "ACCEPTED")}>Accept</button>
                            <button type="button" className="btn btn-danger btn-sm" onClick={() => setRejecting(enrollment)}>Reject</button>
                          </div>
                        ) : status === "ACCEPTED" ? (
                          <button type="button" className="btn btn-secondary btn-sm" onClick={() => processEnrollment(enrollment._id || enrollment.id, "CANCELLED")}>Cancel enrollment</button>
                        ) : (
                          <span className="td-muted">Reviewed</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      ) : null}

      <Modal
        open={!!rejecting}
        title="Reject enrollment request"
        onClose={() => setRejecting(null)}
        footer={
          <>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setRejecting(null)}>Cancel</button>
            <button
              type="button"
              className="btn btn-danger btn-sm"
              onClick={() => rejecting && processEnrollment(rejecting._id || rejecting.id, "REJECTED", reason)}
            >
              Reject request
            </button>
          </>
        }
      >
        <div className="form-group">
          <label className="form-label">Reason</label>
          <textarea className="form-textarea" value={reason} onChange={(e) => setReason(e.target.value)} />
        </div>
      </Modal>
    </AppShell>
  );
}
