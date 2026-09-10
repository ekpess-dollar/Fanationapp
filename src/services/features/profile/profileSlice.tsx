/* eslint-disable @typescript-eslint/no-explicit-any */
import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

export interface SettingProp {
  profileDetails: object;
}

const initialState: SettingProp = {
  profileDetails: {},
};

export const profileSlice = createSlice({
  name: "profile",
  initialState,
  reducers: {
    updateProfileObject: (state, action: PayloadAction<any>) => {
      state.profileDetails = action.payload;
    },
  },
});

export const { updateProfileObject } = profileSlice.actions;

export default profileSlice.reducer;
