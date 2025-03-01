import { createSlice } from "@reduxjs/toolkit";
// sau dau : là để khai báo kiểu dữ liệu  ( kiểu null nếu chưa login | kiểu User nếu đã login)
const initialState = null;

export const userSlice = createSlice({
  name: "user",
  initialState, 
  reducers: {
    // login: (state, action) => (state = action.payload),
    login: (state, action) => {
      state.user = action.payload.user;
      state.role = action.payload.role;
    },
    // logout: () => initialState,
    logout: (state) => {
      state.user = null;
      state.role = null;
    },
  },
});

export const { login, logout } = userSlice.actions;
export default userSlice.reducer;
