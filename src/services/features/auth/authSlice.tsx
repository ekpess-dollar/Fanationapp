/* eslint-disable @typescript-eslint/no-explicit-any */
import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

type EmailType = "Reset" | "Signup" | null;

export interface UserObject {
  email: string;
  role: string;
  usid: string;
}

export interface AuthState {
  userEmail: string | null;
  emailType: EmailType;
  userObject: UserObject | null;
}

const initialState: AuthState = {
  userEmail: null,
  emailType: null,
  userObject: null,
};

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    updateUserEmail: (state, action: PayloadAction<string>) => {
      state.userEmail = action.payload;
    },
    updateEmailType: (state, action: PayloadAction<EmailType>) => {
      state.emailType = action.payload;
    },
    updateUserObject: (state, action: PayloadAction<any>) => {
      state.userObject = action.payload;
    },
    logout: (state) => {
      state.userEmail = null;
      state.emailType = null;
      state.userObject = null;
    },
  },
});

// Action creators are generated for each case reducer function
export const { updateUserEmail, updateEmailType, updateUserObject, logout } =
  authSlice.actions;

export default authSlice.reducer;
