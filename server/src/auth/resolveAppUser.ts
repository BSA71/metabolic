import type { DecodedIdToken } from "firebase-admin/auth";
import type { User } from "@prisma/client";
import { Prisma } from "@prisma/client";
import { prisma } from "../db/prisma.js";

function splitName(firebaseUser: DecodedIdToken) {
  const [firstName = "Metabolic", ...lastNameParts] = (firebaseUser.name || firebaseUser.email?.split("@")[0] || "User")
    .trim()
    .split(/\s+/);
  return { firstName, lastName: lastNameParts.join(" ") || "User" };
}

export async function resolveAppUser(firebaseUser: DecodedIdToken): Promise<User | null> {
  const byUid = await prisma.user.findUnique({ where: { firebaseUid: firebaseUser.uid } });
  if (byUid) return byUid;

  if (firebaseUser.email) {
    const byEmail = await prisma.user.findUnique({ where: { email: firebaseUser.email } });
    if (byEmail) {
      if (byEmail.firebaseUid.startsWith("seed-")) {
        return prisma.user.update({
          where: { id: byEmail.id },
          data: { firebaseUid: firebaseUser.uid }
        });
      }
      if (byEmail.firebaseUid === firebaseUser.uid) return byEmail;
      return null;
    }
  }

  if (!firebaseUser.email) return null;

  const { firstName, lastName } = splitName(firebaseUser);

  try {
    return await prisma.user.create({
      data: {
        firebaseUid: firebaseUser.uid,
        email: firebaseUser.email,
        firstName,
        lastName,
        role: "USER",
        status: "ACTIVE"
      }
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const existing = await prisma.user.findUnique({ where: { firebaseUid: firebaseUser.uid } });
      if (existing) return existing;
      if (firebaseUser.email) {
        return prisma.user.findUnique({ where: { email: firebaseUser.email } });
      }
    }
    throw error;
  }
}
