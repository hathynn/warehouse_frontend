import { configureStore, combineReducers } from "@reduxjs/toolkit";
import storage from "redux-persist/lib/storage";
import persistReducer from "redux-persist/es/persistReducer";
import persistStore from "redux-persist/es/persistStore";
import userReducer from "./features/userSlice";


// Kết hợp tất cả reducers
const rootReducer = combineReducers({
  user: userReducer,
});

// Cấu hình persist
const persistConfig = {
  key: "root",
  storage,
};

// Tạo persisted reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

// Tạo store
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false, // Tắt kiểm tra serializable để tránh lỗi redux-persist
    }),
});

// Tạo persistor
export const persistor = persistStore(store);
