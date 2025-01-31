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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

const formSchema = z.object({
  name: z.string().trim().min(3, "Name must be at least 3 characters"),
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
});
export const SignUpCard = () => {
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", email: "", password: "" },
  });
  const onSubmit = (values: z.infer<typeof formSchema>) => {
    console.log(values);
  };
  return (
    <Card className="w-[450px] h-full md:w-[700px] border-none shadow-none">
      <CardHeader className="text-center pb-3">
        <div className="flex flex-col items-center space-y-3">
          <Image
            src="/sign-up.png"
            alt="Create Account"
            width={200}
            height={200}
            className="rounded-full"
          />
          <CardTitle className="text-2xl font-bold">Create Account</CardTitle>
          <CardDescription>
            By continuing, you agree to our {""}
            <Link href="/privacy" className="text-blue-700 hover:underline">
              Privacy Policy
            </Link>{" "}
            and {""}
            <Link href="/terms" className="text-blue-700 hover:underline">
              Terms of Use
            </Link>{" "}
          </CardDescription>
        </div>
      </CardHeader>
      <div className="px-7">
        <DottedSeparator />
      </div>
      <CardContent className="p-7">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-y-4"
          >
            <FormField
              name="name"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input {...field} placeholder="Add your name" type="text" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              name="email"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Add your email address"
                      type="email"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              name="password"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Add your password"
                      type="password"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button size="lg" className="w-full">
              Sign Up
            </Button>
          </form>
        </Form>
      </CardContent>
      <div className="px-7">
        <DottedSeparator />
      </div>
      <CardContent className="p-7 space-y-4">
        <div className="flex flex-col gap-y-4">
          <Button size="lg" className="w-full" variant="secondary">
            <FcGoogle className="size-6 mr-2" />
            Sign up with Google
          </Button>
          <Button size="lg" className="w-full" variant="secondary">
            <FaGithub className="size-6 mr-2" />
            Sign up with Github
          </Button>
        </div>
        <div className="px-7">
          <DottedSeparator />
        </div>
        <div className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/sign-in" className="text-primary hover:underline">
            Sign in
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};
