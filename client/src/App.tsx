import { BrowserRouter, Navigate, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import BookHost from "./pages/BookHost";
import MyBookings from "./pages/MyBookings";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Landing />} />
          <Route path="login" element={<Login />} />
          <Route path="dashboard" element={<Dashboard />} />
          {/* pre-rework bookmark: admin login lived at /admin */}
          <Route path="admin" element={<Navigate to="/dashboard" replace />} />
          <Route path="my-bookings" element={<MyBookings />} />
          <Route path="book/:slug" element={<BookHost />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
