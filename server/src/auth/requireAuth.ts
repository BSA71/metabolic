import type { FastifyReply, FastifyRequest } from "fastify";
import type { DecodedIdToken } from "firebase-admin/auth";
import type { User } from "@prisma/client";
import { getFirebaseAdmin } from "./firebaseAdmin.js";
import { resolveAppUser } from "./resolveAppUser.js";

declare module "fastify" {
  interface FastifyRequest {
    firebaseUser?: DecodedIdToken;
    appUser?: User;
  }
}

export async function requireAuth(request: FastifyRequest, reply: FastifyReply) {
  const header = request.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;
  if (!token) return reply.code(401).send({ error: "Missing bearer token" });

  let firebaseUser: DecodedIdToken;
  try {
    firebaseUser = await getFirebaseAdmin().auth().verifyIdToken(token);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid Firebase token";
    request.log.warn({ err: error }, "Firebase token verification failed");
    return reply.code(401).send({ error: message });
  }

  try {
    const appUser = await resolveAppUser(firebaseUser);
    if (!appUser) return reply.code(403).send({ error: "No Metabolic app user is linked to this Firebase account" });
    if (appUser.status === "DISABLED") return reply.code(403).send({ error: "User is disabled" });

    request.firebaseUser = firebaseUser;
    request.appUser = appUser;
  } catch (error) {
    request.log.error({ err: error }, "Failed to resolve app user");
    const message = error instanceof Error ? error.message : "Unable to load app user";
    return reply.code(500).send({ error: message });
  }
}
