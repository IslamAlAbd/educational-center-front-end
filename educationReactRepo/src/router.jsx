import { createBrowserRouter, Navigate } from "react-router-dom";
import { LoginPage } from "./pages/auth/LoginPage";
import { RegisterPage } from "./pages/auth/RegisterPage";
import { AdminDashboardPage } from "./pages/admin/AdminDashboardPage";
import { CategoriesPage } from "./pages/admin/CategoriesPage";
import { CoursesPage } from "./pages/admin/CoursesPage";
import { TeachersPage } from "./pages/admin/TeachersPage";
import { EnrollmentsPage } from "./pages/admin/EnrollmentsPage";
import { BrowseCoursesPage } from "./pages/student/BrowseCoursesPage";
import { StudentCoursesPage } from "./pages/student/StudentCoursesPage";
import { StudentGradesPage } from "./pages/student/StudentGradesPage";
import { TeacherCoursesPage } from "./pages/teacher/TeacherCoursesPage";
import { TeacherCourseDetailPage } from "./pages/teacher/TeacherCourseDetailPage";
import { TeacherGradesPage } from "./pages/teacher/TeacherGradesPage";
import { RequireRole } from "./lib/auth/RequireRole";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/login" replace />,
  },
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/register",
    element: <RegisterPage />,
  },
  {
    path: "/admin/dashboard",
    element: (
      <RequireRole role="ADMIN">
        <AdminDashboardPage />
      </RequireRole>
    ),
  },
  {
    path: "/admin/categories",
    element: <RequireRole role="ADMIN"><CategoriesPage /></RequireRole>,
  },
  {
    path: "/admin/courses",
    element: <RequireRole role="ADMIN"><CoursesPage /></RequireRole>,
  },
  {
    path: "/admin/teachers",
    element: <RequireRole role="ADMIN"><TeachersPage /></RequireRole>,
  },
  {
    path: "/admin/enrollments",
    element: <RequireRole role="ADMIN"><EnrollmentsPage /></RequireRole>,
  },
  {
    path: "/student/browse",
    element: <RequireRole role="STUDENT"><BrowseCoursesPage /></RequireRole>,
  },
  {
    path: "/student/my-courses",
    element: <RequireRole role="STUDENT"><StudentCoursesPage /></RequireRole>,
  },
  {
    path: "/student/my-grades",
    element: <RequireRole role="STUDENT"><StudentGradesPage /></RequireRole>,
  },
  {
    path: "/teacher/courses",
    element: <RequireRole role="TEACHER"><TeacherCoursesPage /></RequireRole>,
  },
  {
    path: "/teacher/courses/:courseId",
    element: <RequireRole role="TEACHER"><TeacherCourseDetailPage /></RequireRole>,
  },
  {
    path: "/teacher/grades",
    element: <RequireRole role="TEACHER"><TeacherGradesPage /></RequireRole>,
  },
]);
