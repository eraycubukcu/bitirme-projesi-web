import { Route, Routes } from "react-router-dom";
import FormPage from "./pages/public/FormPage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<FormPage />}></Route>
    </Routes>
  );
}

export default App;
