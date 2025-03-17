import "./App.css";
import { RouterProvider } from "react-router-dom";
import { Provider } from "react-redux";
import { persistor, store } from "./redux/store";
import { PersistGate } from "redux-persist/integration/react";
// import "aos/dist/aos.css";
import "./index.css";
import rootRouter from "./routes/rootRouter";

function App() {
  return (
    <Provider store={store}>
      <PersistGate persistor={persistor}>
        <RouterProvider router={rootRouter} />
      </PersistGate>
    </Provider>
  );
}

export default App;
