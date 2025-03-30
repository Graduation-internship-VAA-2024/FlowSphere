import { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    // Xử lý gửi tin nhắn
    res.status(200).json({ message: "Message sent successfully!" });
  } else {
    res.status(405).json({ message: "Method Not Allowed" });
  }
}
