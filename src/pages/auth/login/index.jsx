import { FcGoogle } from "react-icons/fc";
import bg from "@/assets/bg.png"
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { login } from "@/redux/features/userSlice";

const Login = () => {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = () => {
    let role = null;
    if (email === "admin@gmail.com" && password === "admin") {
      role = "ADMIN";
    } else if (email === "user@gmail.com" && password === "user") {
      role = "USER";
    }
console.log("Email", email)
    if (role) {
      // dispatch(login({ user: email, role }));
      // console.log("Redux", user)
      nav("/home");
    } else {
      alert("Email hoặc mật khẩu không đúng!");
    }
  };

  return (
    <div style={{ backgroundImage:`url(${bg})` }} className="bg-cover bg-center flex items-center justify-center h-screen bg-gradient-to-br from-pink-200 to-purple-300">
      <div className="bg-white p-8 rounded-lg shadow-lg w-96">
        <h2 className="text-2xl font-bold text-center mb-4">Chào mừng bạn!</h2>
        <form>

          <div className="mb-4">
            <label  className="block text-gray-700 font-medium">Email</label>
            <input
              type="email"
              placeholder="Nhập email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 mt-2 border rounded-lg focus:outline-none focus:ring-2 focus:black"
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 font-medium">Mật khẩu</label>
            <input
              type="password"
              placeholder="Nhập mật khẩu"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 mt-2 border rounded-lg focus:outline-none focus:ring-2 focus:black"
            />
          </div>


          <div className="flex justify-between items-center mb-4">
            <label className="flex items-center">
              <input type="checkbox" className="mr-2 " />
              Ghi nhớ tôi
            </label>
            <a href="#" className="text-black  hover:underline">
              Quên mật khẩu?
            </a>
          </div>


          <button onClick={handleLogin} className="w-full bg-black text-white py-2 rounded-lg font-medium hover:opacity-80">
            Đăng nhập
          </button>

          <div className="text-center my-4 text-gray-500">hoặc</div>

          <button className="w-full flex gap-2 items-center justify-center bg-white border py-2 rounded-lg shadow-sm hover:shadow-md">
            <FcGoogle />
            Tiếp tục với Google
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
