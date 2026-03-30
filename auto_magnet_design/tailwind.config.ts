import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/components/**/*.{js,ts,jsx,tsx,mdx}", // <-- MAKE SURE THIS LINE EXISTS
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",        // <-- Add this if you use a 'src' directory
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
export default config;