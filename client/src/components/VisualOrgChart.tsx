import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Building2, 
  Users, 
  Crown, 
  Shield, 
  User, 
  ChevronDown, 
  ChevronRight,
  UserCheck,
  MapPin,
  Mail,
  Phone
} from 'lucide-react';
import '@/styles/org-chart.css';

interface OrgNode {
  id: string;
  name: string;
  type: 'company' | 'branch' | 'team' | 'employee';
  title?: string;
  email?: string;
  location?: string;
  role?: string;
  memberCount?: number;
  maxMembers?: number;
  children?: OrgNode[];
  avatar?: string;
  isExpanded?: boolean;
}

interface VisualOrgChartProps {
  data: {
    company: any;
    branches: any[];
    teams: any[];
    employees: any[];
    managers: any[];
  };
}

const VisualOrgChart: React.FC<VisualOrgChartProps> = ({ data }) => {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['company']));
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  // Transform the flat data structure into a hierarchical tree
  const buildOrgTree = (): OrgNode => {
    const { company, branches, teams, employees } = data;

    // Build company root node
    const companyNode: OrgNode = {
      id: company?.id || 'company',
      name: company?.companyName || 'Company',
      type: 'company',
      title: 'Headquarters',
      location: company?.address,
      children: [],
      isExpanded: expandedNodes.has(company?.id || 'company')
    };

    // Add branches
    if (branches && branches.length > 0) {
      branches.forEach((branch: any) => {
        const branchEmployees = employees?.filter((emp: any) => emp.branchId === branch.id) || [];
        const branchTeams = teams?.filter((team: any) => team.branchId === branch.id) || [];

        const branchNode: OrgNode = {
          id: branch.id,
          name: branch.name,
          type: 'branch',
          title: branch.description || 'Branch Office',
          location: branch.location,
          memberCount: branchEmployees.length,
          children: [],
          isExpanded: expandedNodes.has(branch.id)
        };

        // Add teams to branch
        branchTeams.forEach((team: any) => {
          const teamEmployees = employees?.filter((emp: any) => emp.teamId === team.id) || [];
          
          const teamNode: OrgNode = {
            id: team.id,
            name: team.name,
            type: 'team',
            title: team.description || 'Team',
            memberCount: teamEmployees.length,
            maxMembers: team.maxMembers,
            children: [],
            isExpanded: expandedNodes.has(team.id)
          };

          // Add employees to team
          teamEmployees.forEach((employee: any) => {
            teamNode.children?.push({
              id: employee.id,
              name: `${employee.firstName} ${employee.lastName}`,
              type: 'employee',
              title: employee.hierarchyRole || 'Employee',
              email: employee.email,
              role: employee.position
            });
          });

          branchNode.children?.push(teamNode);
        });

        companyNode.children?.push(branchNode);
      });
    }

    // Add headquarters teams (teams without branchId)
    const hqTeams = teams?.filter((team: any) => !team.branchId) || [];
    hqTeams.forEach((team: any) => {
      const teamEmployees = employees?.filter((emp: any) => emp.teamId === team.id) || [];
      
      const teamNode: OrgNode = {
        id: team.id,
        name: team.name,
        type: 'team',
        title: team.description || 'HQ Team',
        memberCount: teamEmployees.length,
        maxMembers: team.maxMembers,
        children: [],
        isExpanded: expandedNodes.has(team.id)
      };

      // Add employees to HQ team
      teamEmployees.forEach((employee: any) => {
        teamNode.children?.push({
          id: employee.id,
          name: `${employee.firstName} ${employee.lastName}`,
          type: 'employee',
          title: employee.hierarchyRole || 'Employee',
          email: employee.email,
          role: employee.position
        });
      });

      companyNode.children?.push(teamNode);
    });

    // Add direct company employees (no team/branch)
    const directEmployees = employees?.filter((emp: any) => !emp.teamId && !emp.branchId) || [];
    directEmployees.forEach((employee: any) => {
      companyNode.children?.push({
        id: employee.id,
        name: `${employee.firstName} ${employee.lastName}`,
        type: 'employee',
        title: employee.hierarchyRole || 'Employee',
        email: employee.email,
        role: employee.position
      });
    });

    return companyNode;
  };

  const toggleExpanded = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const getNodeIcon = (type: string) => {
    switch (type) {
      case 'company': return <Crown className="h-5 w-5" />;
      case 'branch': return <Building2 className="h-5 w-5" />;
      case 'team': return <Users className="h-5 w-5" />;
      case 'employee': return <User className="h-4 w-4" />;
      default: return <User className="h-4 w-4" />;
    }
  };

  const getNodeColors = (type: string) => {
    switch (type) {
      case 'company': 
        return {
          bg: 'bg-gradient-to-r from-purple-500 to-purple-600',
          border: 'border-purple-300',
          text: 'text-white',
          icon: 'text-white'
        };
      case 'branch': 
        return {
          bg: 'bg-gradient-to-r from-blue-500 to-blue-600',
          border: 'border-blue-300',
          text: 'text-white',
          icon: 'text-white'
        };
      case 'team': 
        return {
          bg: 'bg-gradient-to-r from-green-500 to-green-600',
          border: 'border-green-300',
          text: 'text-white',
          icon: 'text-white'
        };
      case 'employee': 
        return {
          bg: 'bg-white dark:bg-gray-800',
          border: 'border-gray-200 dark:border-gray-700',
          text: 'text-gray-900 dark:text-gray-100',
          icon: 'text-gray-600 dark:text-gray-400'
        };
      default: 
        return {
          bg: 'bg-gray-100',
          border: 'border-gray-300',
          text: 'text-gray-900',
          icon: 'text-gray-600'
        };
    }
  };

  const NodeCard: React.FC<{ node: OrgNode; level: number }> = ({ node, level }) => {
    const colors = getNodeColors(node.type);
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedNodes.has(node.id);
    const isSelected = selectedNode === node.id;

    return (
      <div className="relative">
        {/* Connecting Lines */}
        {level > 0 && (
          <>
            <div className="absolute -left-3 md:-left-6 top-1/2 w-3 md:w-6 h-px bg-gray-300 dark:bg-gray-600 org-connection-line animate"></div>
            <div className="absolute -left-3 md:-left-6 -top-4 w-px h-8 bg-gray-300 dark:bg-gray-600 org-connection-line"></div>
          </>
        )}

        {/* Node Card */}
        <Card 
          className={`
            org-node-card org-node-shadow
            ${colors.border} ${isSelected ? 'ring-2 ring-blue-500 shadow-lg' : 'shadow-sm'} 
            hover:shadow-md transition-all duration-300 cursor-pointer transform hover:scale-105
            ${node.type === 'employee' ? 'w-64 md:w-64' : 'w-72 md:w-80'} max-w-full
          `}
          onClick={() => setSelectedNode(selectedNode === node.id ? null : node.id)}
        >
          <CardContent className={`p-4 ${colors.bg} rounded-lg`}>
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3 flex-1">
                {/* Avatar/Icon */}
                <div className={`
                  org-avatar
                  ${node.type === 'employee' ? 'w-10 h-10' : 'w-12 h-12'} 
                  bg-white bg-opacity-20 rounded-full flex items-center justify-center
                  transition-transform duration-300 hover:scale-110
                `}>
                  {node.type === 'employee' ? (
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-lg">
                      {node.name.split(' ').map(n => n[0]).join('')}
                    </div>
                  ) : (
                    <div className={`${colors.icon} transition-transform duration-300`}>
                      {getNodeIcon(node.type)}
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h3 className={`font-semibold ${colors.text} truncate`}>
                    {node.name}
                  </h3>
                  <p className={`text-sm ${colors.text} opacity-90 truncate`}>
                    {node.title}
                  </p>
                  
                  {/* Additional Info */}
                  <div className="mt-2 space-y-1">
                    {node.location && (
                      <div className={`flex items-center gap-1 text-xs ${colors.text} opacity-80`}>
                        <MapPin className="h-3 w-3" />
                        <span className="truncate">{node.location}</span>
                      </div>
                    )}
                    {node.email && (
                      <div className={`flex items-center gap-1 text-xs ${colors.text} opacity-80`}>
                        <Mail className="h-3 w-3" />
                        <span className="truncate">{node.email}</span>
                      </div>
                    )}
                    {typeof node.memberCount === 'number' && (
                      <div className={`flex items-center gap-1 text-xs ${colors.text} opacity-80`}>
                        <Users className="h-3 w-3" />
                        <span>
                          {node.memberCount} member{node.memberCount !== 1 ? 's' : ''}
                          {node.maxMembers && ` / ${node.maxMembers} max`}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Expand/Collapse Button */}
              {hasChildren && (
                <Button
                  variant="ghost"
                  size="sm"
                  className={`${colors.text} opacity-80 hover:opacity-100 p-1 h-6 w-6`}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleExpanded(node.id);
                  }}
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
              )}
            </div>

            {/* Role Badge for Employees */}
            {node.type === 'employee' && node.role && (
              <div className="mt-2">
                <Badge variant="secondary" className="org-badge text-xs bg-white bg-opacity-20 text-white border-white border-opacity-30 transition-all duration-200">
                  {node.role}
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Children */}
        {hasChildren && isExpanded && (
          <div className="org-children-container expanding ml-4 md:ml-8 mt-4 space-y-4 relative">
            {/* Vertical connecting line */}
            <div className="absolute -left-3 md:-left-6 top-0 w-px h-full bg-gray-300 dark:bg-gray-600 org-connection-line"></div>
            
            {node.children?.map((child, index) => (
              <div key={child.id} className="relative" style={{animationDelay: `${index * 0.1}s`}}>
                <NodeCard node={child} level={level + 1} />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const orgTree = buildOrgTree();

  return (
    <div className="w-full">
      {/* Chart Header */}
      <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Building2 className="h-6 w-6 text-blue-600" />
              Organization Chart
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Interactive view of your company structure
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setExpandedNodes(new Set(['company']))}
            >
              Collapse All
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const allIds = new Set(['company']);
                data.branches?.forEach(b => allIds.add(b.id));
                data.teams?.forEach(t => allIds.add(t.id));
                setExpandedNodes(allIds);
              }}
            >
              Expand All
            </Button>
          </div>
        </div>
      </div>

      {/* Organization Tree */}
      <div className="org-chart-container overflow-x-auto">
        <div className="min-w-fit p-4 md:p-6">
          <NodeCard node={orgTree} level={0} />
        </div>
      </div>

      {/* Legend */}
      <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">Legend</h3>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gradient-to-r from-purple-500 to-purple-600 rounded"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">Company</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gradient-to-r from-blue-500 to-blue-600 rounded"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">Branch</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gradient-to-r from-green-500 to-green-600 rounded"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">Team</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-white border border-gray-300 rounded"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">Employee</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VisualOrgChart;