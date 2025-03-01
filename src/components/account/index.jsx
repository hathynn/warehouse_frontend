import { Avatar } from "antd";

function Account({ subTitle, title, src }) {
  return (
    <div className="flex gap-2">
    <div className="flex flex-col justify-center items-end">
      <p className="text-sm">{subTitle}</p>
      <h3 className="text-lg font-medium">{title}</h3>
    </div>
  </div>
  )
}

export default Account