import type { FastifyReply, FastifyRequest } from "fastify";
import type { Role } from "@prisma/client";

export function requireRole(roles: Role[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.appUser;
    if (!user) return reply.code(401).send({ error: "Authentication required" });
    if (!roles.includes(user.role)) return reply.code(403).send({ error: "Insufficient role" });
  };
}

export function canEditOwnOrAssigned(actor: { id: string; role: Role }, ownerId: string) {
  return actor.role === "SUPER_ADMIN" || actor.role === "ADMIN" || actor.id === ownerId;
}
