import { createSlice } from "@reduxjs/toolkit";
// sau dau : là để khai báo kiểu dữ liệu  ( kiểu null nếu chưa login | kiểu User nếu đã login)
const initialState = {
  user: null,
  role: null,
};

export const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    login: (state, action) => {
      return {
        user: action.payload.user,
        role: action.payload.role,
      };
    },
  },
});


export const { login, logout } = userSlice.actions;
export default userSlice.reducer;
