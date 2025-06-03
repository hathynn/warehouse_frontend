import { useState, ChangeEvent, FormEvent } from "react";
import { useDispatch } from "react-redux";
import { setCredentials, setUserInfo } from "@/contexts/redux/features/userSlice";
import useAccountService, { AuthenticationRequest } from "@/services/useAccountService";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import { jwtDecode } from "jwt-decode";

// Interface for JWT decoded token
interface DecodedToken {
  sub: string;
  username: string;
  email: string;
  role: string;
  full_name: string;
  exp: number;
  iat: number;
}

const Login = () => {
  const dispatch = useDispatch();
  const { login, loading } = useAccountService();
  const { redirectToDefaultRoute } = useAuthRedirect();

  const [formData, setFormData] = useState<AuthenticationRequest>({
    username: "",
    password: "",
  });

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const response = await login(formData);

    // Decode token to get user info
    const decodedToken = jwtDecode<DecodedToken>(response.access_token);

    // Dispatch actions to update state
    dispatch(setCredentials({
      accessToken: response.access_token,
      refreshToken: response.refresh_token,
    }));

    dispatch(setUserInfo({
      id: decodedToken.sub,
      email: decodedToken.email,
      role: decodedToken.role,
      fullName: decodedToken.full_name,
    }));

    // Redirect to default route based on role

    redirectToDefaultRoute();
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 text-center">
          Đăng nhập vào tài khoản
        </h2>
        <p className="mt-2 text-sm text-gray-600 text-center">
          Vui lòng nhập thông tin đăng nhập của bạn
        </p>
      </div>

      <form className="space-y-6" onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">
              Tên đăng nhập
            </label>
            <input
              id="username"
              name="username"
              type="text"
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 
              focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Nhập tên tài khoản của bạn"
              value={formData.username}
              onChange={handleChange}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Mật khẩu
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 
              focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Nhập mật khẩu của bạn"
              value={formData.password}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              id="remember-me"
              name="remember-me"
              type="checkbox"
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
              Ghi nhớ đăng nhập
            </label>
          </div>

          <a href="#" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
            Quên mật khẩu?
          </a>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium 
          text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 
          disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
        >
          {loading ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Đang đăng nhập...
            </span>
          ) : (
            "Đăng nhập"
          )}
        </button>
      </form>
    </div>
  );
};

export default Login;
