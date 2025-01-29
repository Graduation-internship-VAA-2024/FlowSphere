import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function Home() {
  return (
    <div>
      <h1>Home Page</h1>
      <Input placeholder="Email" />
      <Input placeholder="Password" />
      <Button>Sign In</Button>
    </div>
  );
}
