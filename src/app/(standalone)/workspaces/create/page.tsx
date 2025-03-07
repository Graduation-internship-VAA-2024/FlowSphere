"use client";

import { CreateWorkspaceForm } from "@/features/workspaces/components/create-workspace-form";
import {
  Sparkles,
  Users,
  Workflow,
  Rocket,
  ArrowRight,
  LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

const processSteps = [
  {
    icon: Users,
    title: "Create Workspace",
    description: "Set up your digital environment",
    color: "from-primary/20 to-primary/5",
    iconColor: "text-primary",
  },
  {
    icon: Workflow,
    title: "Configure Settings",
    description: "Customize your workspace",
    color: "from-blue-500/20 to-blue-500/5",
    iconColor: "text-blue-500",
  },
  {
    icon: Rocket,
    title: "Launch & Collaborate",
    description: "Start working with your team",
    color: "from-purple-500/20 to-purple-500/5",
    iconColor: "text-purple-500",
  },
];

const WorkspaceCreatePage = () => {
  const [activeStep, setActiveStep] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((current) => (current + 1) % processSteps.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchUser = async () => {};
    fetchUser();
  }, []);

  return (
    <div className="w-full max-w-[1200px] mx-auto px-4">
      {/* Hero Section */}
      <div className="text-center mb-8 md:mb-12">
        <h1
          className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-blue-600 
          bg-clip-text text-transparent pb-2"
        >
          Create Your Workspace
        </h1>
        <p className="text-neutral-600 mt-2 text-base md:text-lg px-4">
          Start collaborating with your team in a beautiful and organized space
        </p>
      </div>

      <div className="grid lg:grid-cols-[1fr,400px] gap-6 md:gap-8">
        <div className="space-y-8 md:space-y-12">
          {/* Animated Steps - Now at the top */}
          <div className="relative p-4 md:p-8 rounded-2xl bg-white/50 backdrop-blur-sm border border-white/20 overflow-hidden">
            {/* Progress Bar */}
            <div className="absolute bottom-0 left-0 h-1 bg-neutral-100 w-full">
              <div className="h-full bg-primary animate-progress" />
            </div>

            {/* Steps */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 md:gap-4">
              {processSteps.map((step, index) => (
                <div
                  key={step.title}
                  className="flex flex-col md:flex-row items-center gap-4 md:gap-8 w-full md:w-auto"
                >
                  <AnimatedStep
                    {...step}
                    isActive={index === activeStep}
                    stepNumber={index + 1}
                  />
                  {index < processSteps.length - 1 && (
                    <ArrowRight
                      className={cn(
                        "w-6 h-6 rotate-90 md:rotate-0 transition-all duration-300",
                        index === activeStep
                          ? "text-primary animate-arrow-bounce"
                          : "text-neutral-300"
                      )}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Feature Cards */}
          <div className="grid gap-4 md:gap-6">
            <FeatureCard
              icon={<Users className="w-6 h-6 text-primary" />}
              title="Team Collaboration"
              description="Work together seamlessly with your team members in real-time"
            />
            <FeatureCard
              icon={<Workflow className="w-6 h-6 text-blue-500" />}
              title="Streamlined Workflows"
              description="Organize your projects and tasks in a structured manner"
            />
            <FeatureCard
              icon={<Sparkles className="w-6 h-6 text-purple-500" />}
              title="Beautiful Interface"
              description="Enjoy working in a clean and modern environment"
            />
          </div>
        </div>

        {/* Form Section */}
        <div className="relative group">
          <div
            className="absolute inset-0 bg-gradient-to-r from-primary/20 via-blue-500/20 
            to-purple-500/20 rounded-2xl blur-xl opacity-75 group-hover:opacity-100 
            transition-opacity"
          />
          <div
            className="relative bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg 
            hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
          >
            <CreateWorkspaceForm />
          </div>
        </div>
      </div>
    </div>
  );
};

// Feature Card Component
const FeatureCard = ({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) => {
  return (
    <div
      className="group p-4 md:p-6 rounded-xl bg-white/50 hover:bg-white/80 
      border border-neutral-200/50 hover:border-primary/20
      transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
    >
      <div className="flex items-start gap-4">
        <div
          className="p-2 rounded-lg bg-neutral-100/80 group-hover:bg-primary/10 
          transition-colors duration-300"
        >
          {icon}
        </div>
        <div>
          <h3
            className="font-semibold text-lg text-neutral-800 group-hover:text-primary 
            transition-colors duration-300"
          >
            {title}
          </h3>
          <p className="text-neutral-600 mt-1 text-sm md:text-base">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
};

// Animated Step Component
interface AnimatedStepProps {
  icon: LucideIcon;
  title: string;
  description: string;
  color: string;
  iconColor: string;
  isActive: boolean;
  stepNumber: number;
}

const AnimatedStep = ({
  icon: Icon,
  title,
  description,
  color,
  iconColor,
  isActive,
  stepNumber,
}: AnimatedStepProps) => {
  return (
    <div
      className={cn(
        "relative w-full md:w-[180px] p-4 rounded-xl transition-all duration-500",
        "bg-white/50 backdrop-blur-sm border",
        isActive
          ? "border-primary/20 shadow-lg scale-105"
          : "border-white/20 hover:border-primary/10"
      )}
    >
      {/* Step Number */}
      <div
        className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-white 
        shadow-sm flex items-center justify-center border border-neutral-200"
      >
        <span className="text-xs font-medium text-neutral-600">
          {stepNumber}
        </span>
      </div>

      {/* Icon */}
      <div
        className={cn(
          "w-12 h-12 rounded-lg mb-3 relative overflow-hidden",
          "bg-gradient-to-br",
          color
        )}
      >
        <Icon
          className={cn(
            "absolute inset-0 m-auto w-6 h-6 transition-all duration-300",
            iconColor,
            isActive && "scale-110"
          )}
        />
        {isActive && (
          <div
            className="absolute inset-0 bg-gradient-to-br from-white/50 
            animate-pulse"
          />
        )}
      </div>

      {/* Content */}
      <h4
        className={cn(
          "font-medium text-sm mb-1 transition-colors duration-300",
          isActive ? "text-primary" : "text-neutral-600"
        )}
      >
        {title}
      </h4>
      <p className="text-xs text-neutral-500 line-clamp-2">{description}</p>

      {/* Active Step Animation */}
      {isActive && (
        <div
          className="absolute inset-0 rounded-xl border-2 border-primary/20 
          animate-step-ping"
        />
      )}
    </div>
  );
};

export default WorkspaceCreatePage;
