"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

// Minimal, self-contained UI primitives in the spirit of shadcn/ui.
// Vendored locally so the project runs after `npm install` with no extra CLI step.
// Swap for the real shadcn components later if desired.

export function Button({
  className,
  variant = "primary",
  size = "md",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "outline" | "soft";
  size?: "sm" | "md";
}) {
  const variants = {
    primary:
      "bg-ink text-paper hover:bg-ink/90 shadow-sm disabled:opacity-50",
    outline:
      "border border-line-strong bg-paper-raised text-ink hover:border-ink/40 hover:bg-paper",
    ghost: "text-ink-soft hover:bg-line/50",
    soft: "bg-accent-soft text-accent-ink hover:bg-accent-soft/70",
  };
  const sizes = { sm: "h-8 px-3 text-xs", md: "h-10 px-4 text-sm" };
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-colors disabled:cursor-not-allowed",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  );
}

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("panel", className)} {...props} />;
}

export function Badge({
  className,
  tone = "neutral",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & {
  tone?: "neutral" | "good" | "warn" | "bad" | "accent";
}) {
  const tones = {
    neutral: "bg-line/60 text-ink-soft",
    good: "bg-good-soft text-good",
    warn: "bg-warn-soft text-warn",
    bad: "bg-bad-soft text-bad",
    accent: "bg-accent-soft text-accent-ink",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium",
        tones[tone],
        className
      )}
      {...props}
    />
  );
}

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input ref={ref} className={cn("field", className)} {...props} />
));
Input.displayName = "Input";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea ref={ref} className={cn("field resize-y", className)} {...props} />
));
Textarea.displayName = "Textarea";

export function Select({
  className,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn("field appearance-none pr-8", className)} {...props} />;
}

export function Label({
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("label block", className)} {...props} />;
}

// Hover tooltip (info helper text for search fields, tones, etc.)
export function Tooltip({
  content,
  children,
}: {
  content: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <span className="group/tt relative inline-flex">
      {children}
      <span
        role="tooltip"
        className="pointer-events-none absolute left-1/2 top-full z-30 mt-2 w-60 -translate-x-1/2 rounded-xl border border-line-strong bg-ink px-3 py-2 text-xs leading-relaxed text-paper opacity-0 shadow-lift transition-opacity duration-150 group-hover/tt:opacity-100"
      >
        {content}
      </span>
    </span>
  );
}
