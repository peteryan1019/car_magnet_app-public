// app/actions/sendEmail.ts
"use server";

import { Resend } from "resend";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmailAction(imageUrl: string) {
  // Fetch the image and convert to a buffer
  const imageRes = await fetch(imageUrl);
  if (!imageRes.ok) {
    return { success: false, error: "Failed to fetch image from URL" };
  }

  const imageBuffer = Buffer.from(await imageRes.arrayBuffer());

  // Grab the filename from the URL, fallback to "attachment.jpg"
  const filename = imageUrl.split("/").pop()?.split("?")[0] ?? "attachment.jpg";

const session = await getSession();

  const [user] = await db
    .select({ email: users.email })
    .from(users)
    .where(eq(users.id, session.id));

  const { data, error } = await resend.emails.send({
    from: "Auto Magnet Design <onboarding@resend.dev>",
    to: user.email,
    subject: "Here's your generated design!",
    html: `<p>Hi,</p><p>Please find your design attached below.</p><p>Thanks!</p>`,
    attachments: [
      {
        filename,
        content: imageBuffer,
      },
    ],
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, id: data?.id };
}