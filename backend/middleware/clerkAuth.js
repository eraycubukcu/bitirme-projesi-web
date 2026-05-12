import { clerkMiddleware, getAuth, createClerkClient } from "@clerk/express";

export const clerkMw = clerkMiddleware();

const cc = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

export const requireStudent = async (req, res, next) => {
  const { userId } = getAuth(req);

  if (!userId) {
    return res.status(401).json({ message: "Giriş yapmalısınız." });
  }

  try {
    const user = await cc.users.getUser(userId);
    const email =
      user.primaryEmailAddress?.emailAddress ??
      user.emailAddresses?.[0]?.emailAddress;

    if (!email) {
      return res.status(403).json({ message: "E-posta adresi bulunamadı." });
    }

    const domain = process.env.ALLOWED_EMAIL_DOMAIN;
    if (domain && !email.endsWith(`@${domain}`)) {
      return res.status(403).json({
        message: `Sadece @${domain} uzantılı hesaplar kabul edilmektedir.`,
      });
    }

    req.student = {
      clerkUserId: userId,
      email,
      firstName: user.firstName ?? "",
      lastName: user.lastName ?? "",
    };

    next();
  } catch (err) {
    console.error("Clerk auth error:", err.message);
    return res.status(401).json({ message: "Kimlik doğrulaması başarısız." });
  }
};
