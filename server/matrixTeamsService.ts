import { db } from "./db";
import { 
  teams, 
  employeeTeamAssignments, 
  workEntries, 
  employees, 
  managers,
  companies 
} from "@shared/schema";
import { eq, and, or, inArray } from "drizzle-orm";
import type { Team, WorkEntry, EmployeeTeamAssignment } from "@shared/schema";

export class MatrixTeamsService {
  /**
   * Create a new team/project
   */
  async createTeam(companyId: string, teamData: {
    name: string;
    description?: string;
    managerId?: string;
  }): Promise<Team> {
    const [team] = await db
      .insert(teams)
      .values({
        companyId,
        ...teamData,
      })
      .returning();

    return team;
  }

  /**
   * Assign employee to team
   */
  async assignEmployeeToTeam(
    employeeId: string,
    teamId: string,
    companyId: string,
    assignedBy?: string
  ): Promise<EmployeeTeamAssignment> {
    // Check if assignment already exists
    const existing = await db
      .select()
      .from(employeeTeamAssignments)
      .where(
        and(
          eq(employeeTeamAssignments.employeeId, employeeId),
          eq(employeeTeamAssignments.teamId, teamId),
          eq(employeeTeamAssignments.isActive, true)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      throw new Error("Employee is already assigned to this team");
    }

    const [assignment] = await db
      .insert(employeeTeamAssignments)
      .values({
        employeeId,
        teamId,
        companyId,
        assignedBy,
      })
      .returning();

    return assignment;
  }

  /**
   * Get work entries for a manager's teams (manager dashboard)
   */
  async getManagerWorkEntries(managerId: string) {
    // Get manager's teams
    const managerTeams = await db
      .select()
      .from(teams)
      .where(eq(teams.managerId, managerId));

    if (managerTeams.length === 0) {
      return [];
    }

    const teamIds = managerTeams.map(team => team.id);

    // Get work entries for manager's teams
    const entries = await db
      .select({
        id: workEntries.id,
        title: workEntries.title,
        description: workEntries.description,
        startDate: workEntries.startDate,
        endDate: workEntries.endDate,
        status: workEntries.status,
        approvalStatus: workEntries.approvalStatus,
        priority: workEntries.priority,
        hours: workEntries.hours,
        workType: workEntries.workType,
        project: workEntries.project,
        teamId: workEntries.teamId,
        employeeId: workEntries.employeeId,
        companyId: workEntries.companyId,
        isImmutable: workEntries.isImmutable,
        approvedBy: workEntries.approvedBy,
        approvedByType: workEntries.approvedByType,
        approvedAt: workEntries.approvedAt,
        createdAt: workEntries.createdAt,
        // Employee info
        employeeName: employees.firstName,
        employeeLastName: employees.lastName,
        employeeEmail: employees.email,
        // Team info
        teamName: teams.name,
      })
      .from(workEntries)
      .leftJoin(employees, eq(workEntries.employeeId, employees.id))
      .leftJoin(teams, eq(workEntries.teamId, teams.id))
      .where(
        and(
          inArray(workEntries.teamId, teamIds),
          eq(workEntries.approvalStatus, "pending_review") // Only pending entries
        )
      )
      .orderBy(workEntries.createdAt);

    return entries;
  }

  /**
   * Get all work entries for company dashboard (company oversight)
   */
  async getCompanyWorkEntries(companyId: string) {
    const entries = await db
      .select({
        id: workEntries.id,
        title: workEntries.title,
        description: workEntries.description,
        startDate: workEntries.startDate,
        endDate: workEntries.endDate,
        status: workEntries.status,
        approvalStatus: workEntries.approvalStatus,
        priority: workEntries.priority,
        hours: workEntries.hours,
        workType: workEntries.workType,
        project: workEntries.project,
        teamId: workEntries.teamId,
        employeeId: workEntries.employeeId,
        companyId: workEntries.companyId,
        isImmutable: workEntries.isImmutable,
        approvedBy: workEntries.approvedBy,
        approvedByType: workEntries.approvedByType,
        approvedAt: workEntries.approvedAt,
        createdAt: workEntries.createdAt,
        // Employee info
        employeeName: employees.firstName,
        employeeLastName: employees.lastName,
        employeeEmail: employees.email,
        // Team info
        teamName: teams.name,
        // Manager info
        managerName: managers.firstName,
        managerLastName: managers.lastName,
      })
      .from(workEntries)
      .leftJoin(employees, eq(workEntries.employeeId, employees.id))
      .leftJoin(teams, eq(workEntries.teamId, teams.id))
      .leftJoin(managers, eq(teams.managerId, managers.id))
      .where(eq(workEntries.companyId, companyId))
      .orderBy(workEntries.createdAt);

    return entries;
  }

  /**
   * Approve work entry (manager or company)
   */
  async approveWorkEntry(
    entryId: string,
    approverId: string,
    approverType: "manager" | "company",
    comments?: string,
    rating?: number
  ): Promise<WorkEntry> {
    // First check if entry is already approved (immutable)
    const [entry] = await db
      .select()
      .from(workEntries)
      .where(eq(workEntries.id, entryId))
      .limit(1);

    if (!entry) {
      throw new Error("Work entry not found");
    }

    if (entry.isImmutable) {
      throw new Error("Entry already approved or rejected (immutable)");
    }

    if (entry.approvalStatus !== "pending_review") {
      throw new Error("Entry is not in pending review status");
    }

    // Approve the entry (this makes it immutable)
    const [updatedEntry] = await db
      .update(workEntries)
      .set({
        approvalStatus: "approved",
        approvedBy: approverId,
        approvedByType: approverType,
        approvedAt: new Date(),
        approvalComments: comments,
        companyRating: rating,
        isImmutable: true, // Lock the entry
      })
      .where(eq(workEntries.id, entryId))
      .returning();

    return updatedEntry;
  }

  /**
   * Get manager's assigned teams with employee counts
   */
  async getManagerTeamsWithStats(managerId: string) {
    const managerTeams = await db
      .select({
        id: teams.id,
        name: teams.name,
        description: teams.description,
        companyId: teams.companyId,
        createdAt: teams.createdAt,
      })
      .from(teams)
      .where(eq(teams.managerId, managerId));

    // Get employee counts and pending entries for each team
    const teamsWithStats = await Promise.all(
      managerTeams.map(async (team) => {
        // Count employees
        const employeeCount = await db
          .select()
          .from(employeeTeamAssignments)
          .where(
            and(
              eq(employeeTeamAssignments.teamId, team.id),
              eq(employeeTeamAssignments.isActive, true)
            )
          );

        // Count pending work entries
        const pendingEntries = await db
          .select()
          .from(workEntries)
          .where(
            and(
              eq(workEntries.teamId, team.id),
              eq(workEntries.approvalStatus, "pending_review")
            )
          );

        return {
          ...team,
          employeeCount: employeeCount.length,
          pendingEntriesCount: pendingEntries.length,
        };
      })
    );

    return teamsWithStats;
  }

  /**
   * Get company teams overview
   */
  async getCompanyTeams(companyId: string) {
    const companyTeams = await db
      .select({
        id: teams.id,
        name: teams.name,
        description: teams.description,
        managerId: teams.managerId,
        managerName: managers.firstName,
        managerLastName: managers.lastName,
        managerEmail: managers.email,
        createdAt: teams.createdAt,
      })
      .from(teams)
      .leftJoin(managers, eq(teams.managerId, managers.id))
      .where(eq(teams.companyId, companyId));

    return companyTeams;
  }
}

export const matrixTeamsService = new MatrixTeamsService();