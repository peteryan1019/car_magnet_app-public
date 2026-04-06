"use client";
import { useTransition, useState } from "react";
import { sendEmailAction } from "../actions/email-actions";

export default function SendEmailButton({
  imageUrl
}: {
  to: string;
  imageUrl: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [sent, setSent] = useState(false);

  const handleSend = () => {
    startTransition(async () => {
      const result = await sendEmailAction(imageUrl);

      if (result?.error) {
        alert(result.error);
      } else if (result?.success) {
        setSent(true);
      }
    });
  };

  return (
    <button
      onClick={handleSend}
      disabled={isPending || sent}
      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition flex items-center justify-center min-w-[80px] disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isPending ? (
        <span className="flex items-center gap-2">
          <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Sending...
        </span>
      ) : sent ? (
        <span className="flex items-center gap-2">
          <svg className="h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          Sent
        </span>
      ) : (
        "Send to email"
      )}
    </button>
  );
}