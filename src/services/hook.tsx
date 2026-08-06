import {
  useDispatch,
  useSelector,
  useStore,
  type TypedUseSelectorHook,
} from "react-redux";
import { AppDispatch, AppStore, RootState } from "./store";

// Typed hooks for usage across your app
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppStore = () => useStore<AppStore>(); // Uses the `AppStore` type
