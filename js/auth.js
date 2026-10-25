const USERS_KEY = "utubeMusic_users",
  CURRENT_USER_KEY = "utubeMusic_currentUser";
function getUsers() {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY)) || [];
  } catch {
    return [];
  }
}
function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem(CURRENT_USER_KEY));
  } catch {
    return null;
  }
}
function showMessage(el, msg, type = "error") {
  if (el) {
    el.textContent = msg;
    el.className = "form-message " + type;
  }
}
function validEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
function logout() {
  localStorage.removeItem(CURRENT_USER_KEY);
  location.href = "login.html";
}
document.addEventListener("DOMContentLoaded", () => {
  const login = document.getElementById("loginForm"),
    register = document.getElementById("registerForm");
  if (login) {
    const msg = document.getElementById("loginMessage");
    if (new URLSearchParams(location.search).get("registered") === "1")
      showMessage(
        msg,
        "Tạo tài khoản thành công. Mời bạn đăng nhập.",
        "success",
      );
    login.addEventListener("submit", (e) => {
      e.preventDefault();
      const email = document
          .getElementById("loginEmail")
          .value.trim()
          .toLowerCase(),
        password = document.getElementById("loginPassword").value;
      if (!email || !password)
        return showMessage(msg, "Vui lòng nhập email và mật khẩu.");
      const user = getUsers().find(
        (u) => u.email === email && u.password === password,
      );
      if (!user) return showMessage(msg, "Email hoặc mật khẩu chưa chính xác.");
      localStorage.setItem(
        CURRENT_USER_KEY,
        JSON.stringify({
          id: user.id,
          username: user.username,
          email: user.email,
        }),
      );
      location.href = "index.html";
    });
  }
  if (register) {
    register.addEventListener("submit", (e) => {
      e.preventDefault();
      const username = document.getElementById("registerUsername").value.trim(),
        email = document
          .getElementById("registerEmail")
          .value.trim()
          .toLowerCase(),
        password = document.getElementById("registerPassword").value,
        confirm = document.getElementById("registerConfirm").value,
        msg = document.getElementById("registerMessage");
      if (username.length < 3)
        return showMessage(msg, "Tên người dùng cần ít nhất 3 ký tự.");
      if (!validEmail(email))
        return showMessage(msg, "Vui lòng nhập email hợp lệ.");
      if (password.length < 6)
        return showMessage(msg, "Mật khẩu cần ít nhất 6 ký tự.");
      if (password !== confirm)
        return showMessage(msg, "Mật khẩu xác nhận không khớp.");
      const users = getUsers();
      if (users.some((u) => u.email === email))
        return showMessage(msg, "Email này đã được đăng ký.");
      users.push({ id: Date.now(), username, email, password });
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
      location.href = "login.html?registered=1";
    });
  }
});
