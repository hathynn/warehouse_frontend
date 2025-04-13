import { Outlet } from "react-router-dom";
import bg from "@/assets/bg.png";

/**
 * AuthLayout serves as a wrapper for authentication-related pages
 * such as login, register, forgot password, etc.
 * It provides a consistent background and styling for all auth pages.
 */
const AuthLayout = () => {
  return (
    <div
      style={{ backgroundImage: `url(${bg})` }}
      className="auth-layout min-h-screen bg-cover bg-center flex items-center justify-center bg-gradient-to-br from-pink-200 to-purple-300"
    >
      <div className="bg-white p-8 rounded-xl shadow-2xl w-[450px] mx-4">
        <Outlet />
      </div>
    </div>
  );
};

export default AuthLayout;
