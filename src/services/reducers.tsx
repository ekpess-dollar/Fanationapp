/* eslint-disable @typescript-eslint/no-explicit-any */
import { combineReducers, type Reducer } from "@reduxjs/toolkit";
import authSlice from "./features/auth/authSlice";
import settingMobileViewSlice from "./features/mobileView/settingMobileViewSlice";
import profileSlice from "./features/profile/profileSlice";

const appReducer = combineReducers({
  auth: authSlice,
  settingMobile: settingMobileViewSlice,
  profile: profileSlice,
});

const rootReducer: Reducer = (state: any, action: any) => {
  return appReducer(state, action);
};

export default rootReducer;
