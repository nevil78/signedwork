import { useState } from 'react';
import { useParams, Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  User, 
  Building2, 
  CheckCircle, 
  AlertCircle, 
  Play,
  Tag,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { format } from 'date-fns';
import type { WorkEntry, Employee, Company } from '@shared/schema';

interface WorkEntryWithCompany extends WorkEntry {
  company?: Company;
}

export default function CompanyEmployeeWorkDiary() {
  const { employeeId } = useParams();
  const [expandedCompanies, setExpandedCompanies] = useState<Set<string>>(new Set());

  // Get employee details
  const { data: employee, isLoading: employeeLoading } = useQuery<Employee>({
    queryKey: ['/api/company/employee', employeeId],
  });

  // Get work entries for this employee
  const { data: workEntries = [], isLoading: workEntriesLoading } = useQuery<WorkEntryWithCompany[]>({
    queryKey: ['/api/company/employee-work-entries', employeeId],
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'todo': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'in_progress': return <Play className="h-4 w-4" />;
      case 'todo': return <AlertCircle className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const toggleCompany = (companyName: string) => {
    const newExpanded = new Set(expandedCompanies);
    if (newExpanded.has(companyName)) {
      newExpanded.delete(companyName);
    } else {
      newExpanded.add(companyName);
    }
    setExpandedCompanies(newExpanded);
  };

  if (employeeLoading || workEntriesLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-48 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-6xl mx-auto">
          <Card>
            <CardContent className="p-6 text-center">
              <h2 className="text-xl font-semibold mb-2">Employee Not Found</h2>
              <p className="text-muted-foreground mb-4">
                The requested employee could not be found.
              </p>
              <Button asChild>
                <Link to="/company-recruiter">Back to Recruiter</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" size="icon" asChild>
            <Link to="/company-recruiter">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {employee.firstName} {employee.lastName}'s Work Diary
            </h1>
            <p className="text-muted-foreground">
              View work entries and daily activities
            </p>
          </div>
        </div>

        {/* Employee Info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Employee Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Name</p>
                <p className="text-lg">{employee.firstName} {employee.lastName}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Email</p>
                <p className="text-lg">{employee.email}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Employee ID</p>
                <p className="text-lg font-mono">{employee.employeeId}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Work Entries */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Work Entries ({workEntries.length})</h2>
          </div>

          {workEntries.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Work Entries</h3>
                <p className="text-muted-foreground">
                  This employee hasn't created any work entries yet.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-8">
              {(() => {
                // Group work entries by company
                const groupedEntries = workEntries.reduce((groups: Record<string, WorkEntryWithCompany[]>, entry) => {
                  const companyName = (entry as any).companyName || employee?.currentCompany || 'Unknown Company';
                  if (!groups[companyName]) {
                    groups[companyName] = [];
                  }
                  groups[companyName].push(entry);
                  return groups;
                }, {});

                return Object.entries(groupedEntries).map(([companyName, entries]) => (
                  <div key={companyName} className="space-y-4">
                    {/* Company Header - Clickable */}
                    <button
                      onClick={() => toggleCompany(companyName)}
                      className="flex items-center gap-3 p-4 bg-muted/30 rounded-lg border w-full text-left hover:bg-muted/40 transition-colors"
                      data-testid={`button-toggle-company-${companyName}`}
                    >
                      {expandedCompanies.has(companyName) ? (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      )}
                      <Building2 className="h-6 w-6 text-primary" />
                      <div>
                        <h3 className="text-xl font-semibold">{companyName}</h3>
                        <p className="text-sm text-muted-foreground">
                          {entries.length} work {entries.length === 1 ? 'entry' : 'entries'}
                        </p>
                      </div>
                    </button>

                    {/* Work Entries Grid for this Company - Only show when expanded */}
                    {expandedCompanies.has(companyName) && (
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 pl-4">
                      {entries.map((entry) => (
                        <Card key={entry.id} className="hover:shadow-md transition-shadow">
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                              <CardTitle className="text-lg line-clamp-2">{entry.title}</CardTitle>
                              <div className="flex items-center gap-1 ml-2">
                                {getStatusIcon(entry.status)}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className={getStatusColor(entry.status)}>
                                {entry.status.replace('_', ' ')}
                              </Badge>
                              <Badge className={getPriorityColor(entry.priority)}>
                                {entry.priority}
                              </Badge>
                            </div>
                          </CardHeader>

                          <CardContent className="space-y-4">
                            {entry.description && (
                              <p className="text-sm text-muted-foreground line-clamp-3">
                                {entry.description}
                              </p>
                            )}

                            <div className="space-y-2 text-sm">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span>
                                  {entry.startDate} {entry.endDate ? `to ${entry.endDate}` : '(ongoing)'}
                                </span>
                              </div>

                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <span>
                                  {entry.hours ? `${entry.hours}h logged` : 'N/A'}
                                </span>
                              </div>
                            </div>

                            <Separator />

                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span>Created {entry.createdAt ? format(new Date(entry.createdAt), 'MMM dd') : 'Unknown'}</span>
                              {entry.updatedAt && entry.updatedAt !== entry.createdAt && (
                                <span>Updated {format(new Date(entry.updatedAt), 'MMM dd')}</span>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                      </div>
                    )}
                  </div>
                ));
              })()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}