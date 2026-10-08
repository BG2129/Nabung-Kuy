/**
 * Authentication Module for Nabung Kuy!
 * Handles Local Registration, Login & Session State
 */

const AuthModule = {
  init() {
    // No demo account auto-creation
  },

  getCurrentUser() {
    return StorageEngine.getActiveSession();
  },

  login(username, password) {
    const users = StorageEngine.getUsers();
    const cleanUser = username.trim().toLowerCase();
    const user = users.find(u => u.username.toLowerCase() === cleanUser);

    if (!user) {
      return { success: false, message: 'Username tidak ditemukan. Silakan daftar akun baru terlebih dahulu!' };
    }

    if (user.password !== password) {
      return { success: false, message: 'Password salah. Silakan coba lagi!' };
    }

    // Set active session
    const sessionUser = {
      username: user.username,
      fullName: user.fullName || user.username,
      avatar: (user.avatar || user.username.substring(0, 2)).toUpperCase()
    };
    StorageEngine.setActiveSession(sessionUser);

    // Ensure user has initial data if first time
    const existingData = localStorage.getItem('nabungkuy_data_' + user.username);
    if (!existingData) {
      StorageEngine.saveUserData(user.username, window.DEFAULT_DATA);
    }

    return { success: true, user: sessionUser };
  },

  register(username, password) {
    const users = StorageEngine.getUsers();
    const cleanUser = username ? username.trim().toLowerCase() : '';

    if (!cleanUser || !password) {
      return { success: false, message: 'Username dan Password wajib diisi!' };
    }

    if (cleanUser.length < 3) {
      return { success: false, message: 'Username minimal 3 karakter!' };
    }

    if (users.some(u => u.username.toLowerCase() === cleanUser)) {
      return { success: false, message: 'Username sudah digunakan, pilih username lain!' };
    }

    const newUser = {
      username: cleanUser,
      password: password,
      fullName: cleanUser,
      avatar: cleanUser.substring(0, 2).toUpperCase(),
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    StorageEngine.saveUsers(users);

    // Initialize completely fresh empty data for new user
    StorageEngine.saveUserData(cleanUser, window.DEFAULT_DATA);

    // Auto login
    const sessionUser = {
      username: newUser.username,
      fullName: newUser.fullName,
      avatar: newUser.avatar
    };
    StorageEngine.setActiveSession(sessionUser);

    return { success: true, user: sessionUser };
  },

  logout() {
    StorageEngine.setActiveSession(null);
  }
};

window.AuthModule = AuthModule;
