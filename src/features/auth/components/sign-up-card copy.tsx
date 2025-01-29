import { DottedSeparator } from "@/components/dotted-separator";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { FcGoogle } from "react-icons/fc";
import { FaGithub } from "react-icons/fa";
export const SignUpCard = () => {
  return (
    <Card className="w-[450px] h-full md:w-[487px] border-none shadow-none">
      <CardHeader className="flex items-center justify-center text-center p-7">
        <CardTitle className="text-2xl">Sign Up</CardTitle>
      </CardHeader>
      <div className="px-7 ">
        <DottedSeparator />
      </div>
      <CardContent className="p-7">
        <form className="space-y-4">
          <Input
            required
            placeholder="Enter your email"
            type="email"
            value={""}
            onChange={() => {}}
            disabled={false}
          />
          <Input
            required
            placeholder="Enter your password"
            type="password"
            value={""}
            onChange={() => {}}
            disabled={false}
            min={8}
            max={256}
          />
          <Button disabled={false} size="lg" className="w-full">
            Sign In
          </Button>
        </form>
      </CardContent>
      <div className="px-7">
        <DottedSeparator />
      </div>
      <CardContent className="p-7 flex flex-col gap-y-4">
        <Button
          disabled={false}
          size="lg"
          className="w-full"
          variant="secondary"
        >
          <FcGoogle className="size-6 mr-2" />
          Login with Google
        </Button>
        <Button
          disabled={false}
          size="lg"
          className="w-full"
          variant="secondary"
        >
          <FaGithub className="size-6 mr-2" />
          Login with Github
        </Button>
      </CardContent>
    </Card>
  );
};
