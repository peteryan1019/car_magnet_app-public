// app/actions/sendEmail.ts
"use server";

import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import transporter from "@/lib/mailer";

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

  if (!session) {
    return { success: false, error: "Not authenticated" };
  }

  const [user] = await db
    .select({ email: users.email })
    .from(users)
    .where(eq(users.id, session.id));

  try {
    const info = await transporter.sendMail({
      from: process.env.GMAIL_USER,
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

    return { success: true, id: info.messageId };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to send email";
    return { success: false, error: message };
  }
}