import { createSlice } from "@reduxjs/toolkit";
import { AccountRole } from "@/hooks/useAccountService";

export interface UserState {
  id: string;
  email: string;
  fullName: string;
  role: AccountRole;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
} 

const initialState: UserState = {
  id: "",
  email: "",
  fullName: "",
  role: AccountRole.DEPARTMENT,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
};

export const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      const { accessToken, refreshToken } = action.payload;
      state.accessToken = accessToken;
      state.refreshToken = refreshToken;
      state.isAuthenticated = true;
    },
    setUserInfo: (state, action) => {
      const { id, email, role, fullName } = action.payload;
      state.id = id;
      state.email = email;
      state.role = role;
      state.fullName = fullName;
    },
    logout: (state) => {
      state.id = "";
      state.email = "";
      state.role = AccountRole.DEPARTMENT;
      state.fullName = "";
      state.accessToken = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
    },
  },
});

export const { setCredentials, setUserInfo, logout } = userSlice.actions;
export default userSlice.reducer;
