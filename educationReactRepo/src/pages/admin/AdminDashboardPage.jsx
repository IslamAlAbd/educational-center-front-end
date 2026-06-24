import { useEffect, useState } from "react";
import { AppShell } from "../../components/layout/AppShell";
import { api } from "../../lib/api/client";

function StatCard({ label, value, subtext, accentClass }) {
  return (
    <div className={`stat-card ${accentClass}`}>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      <div className="stat-sub">{subtext}</div>
    </div>
  );
}

export function AdminDashboardPage() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    api
      .get("/admin/statistics/summary")
      .then((response) => {
        if (mounted) {
          setSummary(response?.data || null);
        }
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <AppShell title="Dashboard">
      <div className="page-header">
        <div>
          <h1>Overview</h1>
          <p>Platform-wide metrics for students, teachers, courses, and enrollments.</p>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard
          label="Students"
          value={loading ? "..." : summary?.total_students ?? "-"}
          subtext="registered learners"
          accentClass="accent-teal"
        />
        <StatCard
          label="Teachers"
          value={loading ? "..." : summary?.total_teachers ?? "-"}
          subtext="active instructors"
          accentClass="accent-navy"
        />
        <StatCard
          label="Courses"
          value={loading ? "..." : summary?.total_courses ?? "-"}
          subtext="in the catalogue"
          accentClass="accent-warning"
        />
        <StatCard
          label="Enrollments"
          value={loading ? "..." : summary?.total_enrollments ?? "-"}
          subtext="total requests"
          accentClass="accent-danger"
        />
      </div>
    </AppShell>
  );
}
