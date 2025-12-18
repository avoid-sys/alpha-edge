import { BrowserRouter, Routes, Route } from "react-router-dom";
import Signup from "@/components/Signup";
import Login from "@/components/Login";
import Home from "@/components/Home";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Signup />} />
        <Route path="/login" element={<Login />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}