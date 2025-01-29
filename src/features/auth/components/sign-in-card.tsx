import Image from "next/image";
import Link from "next/link";
import { FaGithub } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DottedSeparator } from "@/components/dotted-separator";

export const SignInCard = () => {
  return (
    <Card className="w-[450px] h-full md:w-[700px] border-none shadow-none">
      {" "}
      <CardHeader className="text-center pb-3">
        <div className="flex flex-col items-center space-y-3">
          <Image
            src="/sign-in.png"
            alt="Welcome Back"
            width={200}
            height={200}        
            className="rounded-full"
          />
          <CardTitle className="text-2xl font-bold">Welcome Back!</CardTitle>
          <CardDescription className="text-base text-muted-foreground">
            Please sign in to continue your journey
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="p-7">
        <form className="flex flex-col gap-y-4">
          <Input
            placeholder="Email"
            type="email"
            value={""}
            onChange={() => {}}
          />
          <Input
            placeholder="Password"
            type="password"
            value={""}
            onChange={() => {}}
          />
          <Button size="lg" className="w-full">
            Sign In
          </Button>
        </form>
      </CardContent>
      <div className="px-7">
        <DottedSeparator />
      </div>
      <CardContent className="p-7 space-y-4">
        <div className="flex flex-col gap-y-4">
          <Button size="lg" className="w-full" variant="secondary">
            <FcGoogle className="size-6 mr-2" />
            Login with Google
          </Button>
          <Button size="lg" className="w-full" variant="secondary">
            <FaGithub className="size-6 mr-2" />
            Login with Github
          </Button>
        </div>
        <div className="text-center text-sm text-muted-foreground">
          Don't have an account?{" "}
          <Link href="/sign-up" className="text-primary hover:underline">
            Sign up
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};
