Dưới đây là nội dung hoàn chỉnh của file `README.md` để bạn có thể sao chép và sử dụng ngay:

````markdown
# FlowSphere Project Setup

This project uses the **Next.js** framework for the Frontend and **HonoJS**, **TanStack** for the Backend.  
It also utilizes **Bun** as the package manager and runtime.

---

## 🧰 Prerequisites

1. **Install Bun**  
   Run the following command in PowerShell:
   ```powershell
   powershell -c "irm bun.sh/install.ps1 | iex"
   ```
````

2. **Install Node.js**
   Download and install from the official website:
   [https://nodejs.org/en](https://nodejs.org/en)

3. **Clone the Repository**
   Open VSCode and terminal, then run:

   ```bash
   git clone https://github.com/Graduation-internship-VAA-2024/FlowSphere.git
   cd FlowSphere
   ```

4. **Install Dependencies**

   ```bash
   bun install
   ```

---

## ⚙️ Environment Variables Setup

1. Create a new file named `.env.local` in the root folder (outside the `src` folder).
2. Add the following lines and fill in the values accordingly:

   ```env
   NEXT_PUBLIC_APP_URL=

   NEXT_PUBLIC_APPWRITE_ENDPOINT=
   NEXT_PUBLIC_APPWRITE_PROJECT=
   NEXT_APPWRITE_KEY=

   NEXT_PUBLIC_APPWRITE_DATABASE_ID=
   NEXT_PUBLIC_APPWRITE_WORKSPACES_ID=
   NEXT_PUBLIC_APPWRITE_MEMBERS_ID=
   NEXT_PUBLIC_APPWRITE_PROJECTS_ID=
   NEXT_PUBLIC_APPWRITE_TASKS_ID=
   NEXT_PUBLIC_APPWRITE_CHATS_ID=
   NEXT_PUBLIC_APPWRITE_MESSAGES_ID=
   NEXT_PUBLIC_APPWRITE_CHAT_MEMBERS_ID=

   NEXT_PUBLIC_APPWRITE_IMAGES_BUCKET=

   OPENROUTER_API_KEY=
   GMAIL_USER=
   GMAIL_APP_PASSWORD=
   ```

---

## 🚀 Run the Development Server

```bash
bun run dev
```

---

> ⚠️ **Note:** Do not commit your `.env.local` file or any secret keys to version control.

```

```
