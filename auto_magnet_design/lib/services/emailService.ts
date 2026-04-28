import type { IUserRepo } from "@/lib/repos/interfaces";
import { getSession } from "@/lib/auth";
import transporter from "@/lib/mailer";

export function createEmailService(deps: { userRepo: IUserRepo }) {
  const { userRepo } = deps;

  async function sendEmail(imageUrl: string) {
    const imageRes = await fetch(imageUrl);
    if (!imageRes.ok) {
      return { success: false, error: "Failed to fetch image from URL" };
    }

    const imageBuffer = Buffer.from(await imageRes.arrayBuffer());

    const filename =
      imageUrl.split("/").pop()?.split("?")[0] ?? "attachment.jpg";

    const session = await getSession();

    if (!session) {
      return { success: false, error: "Not authenticated" };
    }

    const email = await userRepo.findEmailById(session.id);

    if (!email) {
      return { success: false, error: "User not found" };
    }

    try {
      const info = await transporter.sendMail({
        from: process.env.GMAIL_USER,
        to: email,
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
      const message =
        err instanceof Error ? err.message : "Failed to send email";
      return { success: false, error: message };
    }
  }

  return { sendEmail };
}
