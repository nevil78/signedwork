import bcrypt from "bcrypt";
import { nanoid } from "nanoid";
import { db } from "./db";
import { managers, managerInvitations, teams, employeeTeamAssignments } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import type { Manager, InsertManager, ManagerInvitation } from "@shared/schema";

export class ManagerAuthService {
  /**
   * Invite a manager to join a company team
   */
  async inviteManager(
    companyId: string,
    email: string,
    role: string,
    teamId?: string,
    invitedBy?: string
  ): Promise<ManagerInvitation> {
    // Check if manager already exists
    const existingManager = await db
      .select()
      .from(managers)
      .where(eq(managers.email, email))
      .limit(1);

    if (existingManager.length > 0) {
      throw new Error("Manager with this email already exists");
    }

    // Create invitation
    const inviteToken = nanoid(32);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

    const [invitation] = await db
      .insert(managerInvitations)
      .values({
        companyId,
        email,
        role,
        teamId,
        inviteToken,
        invitedBy,
        expiresAt,
      })
      .returning();

    return invitation;
  }

  /**
   * Accept manager invitation and create manager account
   */
  async acceptInvitation(
    inviteToken: string,
    managerData: {
      password: string;
      firstName: string;
      lastName: string;
    }
  ): Promise<Manager> {
    // Find valid invitation
    const invitation = await db
      .select()
      .from(managerInvitations)
      .where(
        and(
          eq(managerInvitations.inviteToken, inviteToken),
          eq(managerInvitations.status, "pending")
        )
      )
      .limit(1);

    if (invitation.length === 0) {
      throw new Error("Invalid or expired invitation");
    }

    const invite = invitation[0];

    // Check expiry
    if (new Date() > invite.expiresAt!) {
      throw new Error("Invitation has expired");
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(managerData.password, 10);

    // Create manager account
    const [manager] = await db
      .insert(managers)
      .values({
        companyId: invite.companyId,
        email: invite.email,
        password: hashedPassword,
        firstName: managerData.firstName,
        lastName: managerData.lastName,
        role: invite.role,
        invitedBy: invite.invitedBy,
        inviteAccepted: true,
      })
      .returning();

    // Update team assignment if specified
    if (invite.teamId) {
      await db
        .update(teams)
        .set({ managerId: manager.id })
        .where(eq(teams.id, invite.teamId));
    }

    // Mark invitation as accepted
    await db
      .update(managerInvitations)
      .set({ status: "accepted" })
      .where(eq(managerInvitations.id, invite.id));

    return manager;
  }

  /**
   * Authenticate manager login
   */
  async authenticateManager(
    email: string,
    password: string
  ): Promise<Manager | null> {
    const [manager] = await db
      .select()
      .from(managers)
      .where(
        and(
          eq(managers.email, email),
          eq(managers.isActive, true)
        )
      )
      .limit(1);

    if (!manager) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, manager.password);
    if (!isPasswordValid) {
      return null;
    }

    // Update last login
    await db
      .update(managers)
      .set({ lastLogin: new Date() })
      .where(eq(managers.id, manager.id));

    return manager;
  }

  /**
   * Get manager's assigned teams and employees
   */
  async getManagerTeams(managerId: string) {
    const managerTeams = await db
      .select({
        id: teams.id,
        name: teams.name,
        description: teams.description,
        companyId: teams.companyId,
      })
      .from(teams)
      .where(eq(teams.managerId, managerId));

    // Get employees for each team
    const teamsWithEmployees = await Promise.all(
      managerTeams.map(async (team) => {
        const employees = await db
          .select()
          .from(employeeTeamAssignments)
          .where(
            and(
              eq(employeeTeamAssignments.teamId, team.id),
              eq(employeeTeamAssignments.isActive, true)
            )
          );

        return {
          ...team,
          employees,
        };
      })
    );

    return teamsWithEmployees;
  }

  /**
   * Get manager by ID
   */
  async getManagerById(managerId: string): Promise<Manager | null> {
    const [manager] = await db
      .select()
      .from(managers)
      .where(eq(managers.id, managerId))
      .limit(1);

    return manager || null;
  }
}

export const managerAuthService = new ManagerAuthService();