import React from "react";
import { Outlet } from "react-router-dom";
import bg from "@/assets/bg.png";
import "./index.scss";

/**
 * AuthLayout serves as a wrapper for authentication-related pages
 * such as login, register, forgot password, etc.
 * It provides a consistent background and styling for all auth pages.
 */
const AuthLayout = () => {
  return (
    <div
      style={{ backgroundImage: `url(${bg})` }}
      className="auth-layout bg-cover bg-center flex items-center justify-center h-screen bg-gradient-to-br from-pink-200 to-purple-300"
    >
      <div className="bg-white p-8 rounded-lg shadow-lg w-96">
        <Outlet />
      </div>
    </div>
  );
};

export default AuthLayout;
