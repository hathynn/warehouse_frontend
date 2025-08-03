import { Outlet } from "react-router-dom";
import bg from "@/assets/bg.png";

const AuthLayout = () => {
  return (
    <div
      style={{ backgroundImage: `url(${bg})` }}
      className="flex items-center justify-center min-h-screen bg-center bg-cover auth-layout bg-gradient-to-br from-pink-200 to-purple-300"
    >
      <div className="bg-white p-8 rounded-xl shadow-2xl w-[450px] mx-4">
        <Outlet />
      </div>
    </div>
  );
};

export default AuthLayout;
