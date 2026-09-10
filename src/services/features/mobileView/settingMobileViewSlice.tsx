import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

export interface SettingProp {
  showOnMobile: boolean;
  showAccountOnMobile: boolean;
  showScheduleOnMobile: boolean;
}

const initialState: SettingProp = {
  showOnMobile: false,
  showAccountOnMobile: false,
  showScheduleOnMobile: false,
};

export const settingMobileViewSlice = createSlice({
  name: "settingMobileView",
  initialState,
  reducers: {
    updateShowOnMobile: (state, action: PayloadAction<boolean>) => {
      state.showOnMobile = action.payload;
    },
    updateAccountShowOnMobile: (state, action: PayloadAction<boolean>) => {
      state.showAccountOnMobile = action.payload;
    },
    updateScheduleShowOnMobile: (state, action: PayloadAction<boolean>) => {
      state.showScheduleOnMobile = action.payload;
    },
  },
});

export const {
  updateShowOnMobile,
  updateAccountShowOnMobile,
  updateScheduleShowOnMobile,
} = settingMobileViewSlice.actions;

export default settingMobileViewSlice.reducer;
