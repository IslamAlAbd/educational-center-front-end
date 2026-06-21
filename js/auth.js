/** 
 * auth.js — Authentication utilities.
 * Works together with window.ROOT_PATH (set per page: './' for root, '../' for subfolders)
 * so redirects resolve correctly whether served from a static server or file://.
 */

const auth = (() => {
  function root() {
    return window.ROOT_PATH || './';
  }

  return {
    getToken() {
      return localStorage.getItem('token');
    },

    getUser() {
      try {
        return JSON.parse(localStorage.getItem('user'));
      } catch {
        return null;
      }
    },

    setSession(token, user) {
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
    },

    clearSession() {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    },

    /** 
     * Call on every protected page.
     * @param {string|null} requiredRole  'ADMIN' | 'TEACHER' | 'STUDENT' | null (any role)
     * @returns {object|null} user if authorised, null if redirect was triggered
     */
    requireAuth(requiredRole = null) {
      const token = this.getToken();
      const user  = this.getUser();

      if (!token || !user) {
        window.location.replace(root() + 'index.html');
        return null;
      }

      if (requiredRole && user.role.toUpperCase() !== requiredRole.toUpperCase()) {
        this.redirectByRole(user.role);
        return null;
      }

      return user;
    },

    redirectByRole(role) {
      role = (role ||  '').toUpperCase();
      const r = root();
      const routes = {
        ADMIN:   r + 'admin/dashboard.html',
        TEACHER: r + 'teacher/courses.html',
        STUDENT: r + 'student/my-courses.html',
      };
      window.location.replace(routes[role] || r + 'index.html');
    },

    logout() {
      this.clearSession();
      window.location.replace(root() + 'index.html');
    },
  };
})();