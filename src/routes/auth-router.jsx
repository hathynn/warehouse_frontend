import { USER_ROUTER } from "@/constants/routes";
import Login from "@/pages/auth/login";
import Register from "@/pages/auth/register";

const authRouter = [
  {
    path: USER_ROUTER.LOGIN,
    element: <Login />,
  },
  {
    path: USER_ROUTER.REGISTER,
    element: <Register />,
  },
];

export default authRouter;
