import React, { useState } from "react";
import { FcGoogle } from "react-icons/fc";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { ROUTES } from "@/constants/routes";

const Register = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const dispatch = useDispatch();

  const handleRegister = () => {
    // Validate inputs
    if (!email || !password || !confirmPassword || !fullName) {
      alert("Vui lòng điền đầy đủ thông tin!");
      return;
    }

    if (password !== confirmPassword) {
      alert("Mật khẩu xác nhận không khớp!");
      return;
    }

    // Here you would typically call an API to register the user
    // For now, we'll just show a success message and redirect to login
    alert("Đăng ký thành công! Vui lòng đăng nhập.");
    navigate("/auth/login");
  };

  return (
    <>
      <h2 className="text-2xl font-bold text-center mb-4">Đăng ký tài khoản</h2>

      <div className="mb-4">
        <label className="block text-gray-700 font-medium">Họ và tên</label>
        <input
          type="text"
          placeholder="Nhập họ và tên"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="w-full px-4 py-2 mt-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
        />
      </div>

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
        <label className="block text-gray-700 font-medium">Số điện thoại</label>
        <input
          type="tel"
          placeholder="Nhập số điện thoại"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
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

      <div className="mb-4">
        <label className="block text-gray-700 font-medium">Xác nhận mật khẩu</label>
        <input
          type="password"
          placeholder="Nhập lại mật khẩu"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full px-4 py-2 mt-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
        />
      </div>

      <div className="flex items-center mb-4">
        <input type="checkbox" className="mr-2" id="terms" />
        <label htmlFor="terms" className="text-sm text-gray-700">
          Tôi đồng ý với <a href="#" className="text-black hover:underline">Điều khoản dịch vụ</a> và{" "}
          <a href="#" className="text-black hover:underline">Chính sách bảo mật</a>
        </label>
      </div>

      <button
        type="button"
        onClick={handleRegister}
        className="w-full bg-black text-white py-2 rounded-lg font-medium hover:opacity-80"
      >
        Đăng ký
      </button>

      <div className="text-center mt-4">
        <span className="text-gray-600">Đã có tài khoản? </span>
        <Link
          to={ROUTES.PUBLIC.LOGIN}
          className="text-black hover:underline"
        >
          Đăng nhập
        </Link>
      </div>
    </>
  );
};

export default Register;
