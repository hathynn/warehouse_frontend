import React, { useState } from "react";
import { FcGoogle } from "react-icons/fc";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { login } from "@/redux/features/userSlice";
import { USER_ROUTER } from "@/constants/routes";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user);

  const handleLogin = () => {
    let role = null;

    if (email === "admin@gmail.com" && password === "admin") {
      role = "DEPARTMENT";
    } else if (email === "user@gmail.com" && password === "user") {
      role = "USER";
    } else if (email === "manager@gmail.com" && password === "manager") {
      role = "WAREHOUSE_MANAGER";
    }

    if (role) {
      dispatch(login({ user: email, role }));
      console.log("User:", user);
      console.log("Role:", role);
      navigate("/");
    } else {
      alert("Email hoặc mật khẩu không đúng!");
    }
  };

  return (
    <>
      <h2 className="text-2xl font-bold text-center mb-4">Chào mừng bạn!</h2>

      <div className="mb-4">
        <label className="block text-gray-700 font-medium">Email</label>
        <input
          type="email"
          placeholder="Nhập email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-2 mt-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
        />
      </div>

      <div className="mb-4">
        <label className="block text-gray-700 font-medium">Mật khẩu</label>
        <input
          type="password"
          placeholder="Nhập mật khẩu"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-2 mt-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
        />
      </div>

      <div className="flex justify-between items-center mb-4">
        <label className="flex items-center">
          <input type="checkbox" className="mr-2" />
          Ghi nhớ tôi
        </label>
        <Link to={USER_ROUTER.REGISTER} className="text-black hover:underline">
          Quên mật khẩu?
        </Link>
      </div>

      <button
        type="button"
        onClick={handleLogin}
        className="w-full bg-black text-white py-2 rounded-lg font-medium hover:opacity-80"
      >
        Đăng nhập
      </button>

      <div className="text-center my-4 text-gray-500">hoặc</div>

      <button className="w-full flex gap-2 items-center justify-center bg-white border py-2 rounded-lg shadow-sm hover:shadow-md">
        <FcGoogle />
        Tiếp tục với Google
      </button>
    </>
  );
};

export default Login;
