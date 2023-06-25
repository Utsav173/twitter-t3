import { type ButtonHTMLAttributes, type DetailedHTMLProps } from "react";

export const Button = ({
  small = false,
  grey = false,
  className = "",
  children,
  ...props
}: {
  small?: boolean;
  grey?: boolean;
  className?: string;
  children: React.ReactNode;
} & DetailedHTMLProps<
  ButtonHTMLAttributes<HTMLButtonElement>,
  HTMLButtonElement
>) => {
  const sizeClasses = small ? "px-2 py-1" : "px-4 py-2 font-bold";
  const colorClasses = grey
    ? "bg-gray-400 hover:bg-gray-300 focus-visible:bg-gray-400"
    : "bg-blue-400 hover:bg-blue-300 focus-visible:bg-blue-400";
  return (
    <button
      className={`rounded-full text-white transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50 ${sizeClasses} ${colorClasses} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
