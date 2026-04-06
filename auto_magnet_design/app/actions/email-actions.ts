// app/actions/sendEmail.ts
"use server";

import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmailAction(to: string, imageUrl: string) {
  // Fetch the image and convert to a buffer
  const imageRes = await fetch(imageUrl);
  if (!imageRes.ok) {
    return { success: false, error: "Failed to fetch image from URL" };
  }

  const imageBuffer = Buffer.from(await imageRes.arrayBuffer());

  // Grab the filename from the URL, fallback to "attachment.jpg"
  const filename = imageUrl.split("/").pop()?.split("?")[0] ?? "attachment.jpg";

  const { data, error } = await resend.emails.send({
    from: "You <you@yourdomain.com>",
    to,
    subject: "Here's your image!",
    html: `<p>Hi,</p><p>Please find your image attached below.</p><p>Thanks!</p>`,
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