import { RouterProvider } from "react-router-dom";
import { Provider } from "react-redux";
import { persistor, store } from "./contexts/redux/store";
import { PersistGate } from "redux-persist/integration/react";
// import "aos/dist/aos.css";
import "./index.css";
import { Router } from "@/router/Router";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { PusherProvider } from "@/contexts/pusher/PusherProvider";
import { FilterProvider } from "@/contexts/filter/FilterProvider";

function App() {
  return (
    <Provider store={store}>
      <PersistGate persistor={persistor}>
        <FilterProvider>
          <PusherProvider>
            <RouterProvider router={Router} />
            <ToastContainer
              position="top-center"
              autoClose={3000}
              hideProgressBar={true}
              newestOnTop
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
              style={{
                width: "fit-content",
                fontSize: "16px",
                "--toastify-toast-width": "280px",
                "--toastify-toast-min-height": "48px",
                "--toastify-toast-padding": "12px",
                "--toastify-toast-bd-radius": "6px",
              }}
            />
          </PusherProvider>
        </FilterProvider>
      </PersistGate>
    </Provider>
  );
}

export default App;
