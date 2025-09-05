import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { 
  Download,
  Calendar as CalendarIcon,
  FileSpreadsheet,
  FileText,
  Database,
  Filter,
  Settings,
  Clock,
  DollarSign,
  Users,
  CheckCircle,
  AlertCircle,
  BarChart3,
  PieChart,
  TrendingUp,
  Shield,
  Zap,
  Eye,
  Copy
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import ClientNavHeader from "@/components/client-nav-header";

interface ExportTemplate {
  id: string;
  name: string;
  description: string;
  type: 'timesheet' | 'financial' | 'performance' | 'comprehensive';
  format: 'csv' | 'excel' | 'pdf' | 'json';
  fields: string[];
  filters: any;
  createdAt: string;
  lastUsed?: string;
  usageCount: number;
}

interface ExportRequest {
  name: string;
  type: 'timesheet' | 'financial' | 'performance' | 'comprehensive';
  format: 'csv' | 'excel' | 'pdf' | 'json';
  dateFrom: string;
  dateTo: string;
  fields: string[];
  filters: {
    freelancers?: string[];
    projects?: string[];
    status?: string[];
    verificationLevel?: string[];
  };
  groupBy?: 'freelancer' | 'project' | 'date' | 'status';
  includeVerification: boolean;
  includeMetadata: boolean;
  compression?: boolean;
  password?: string;
}

export default function CustomExport() {
  const [activeTab, setActiveTab] = useState("quick");
  const [exportName, setExportName] = useState("");
  const [exportType, setExportType] = useState("timesheet");
  const [exportFormat, setExportFormat] = useState("csv");
  const [dateFrom, setDateFrom] = useState<Date | undefined>(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
  const [dateTo, setDateTo] = useState<Date | undefined>(new Date());
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [selectedFreelancers, setSelectedFreelancers] = useState<string[]>([]);
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [includeVerification, setIncludeVerification] = useState(true);
  const [includeMetadata, setIncludeMetadata] = useState(false);
  const [groupBy, setGroupBy] = useState("");
  const [compression, setCompression] = useState(false);
  const [password, setPassword] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch export templates
  const { data: templates = [] } = useQuery({
    queryKey: ["/api/client/export/templates"],
  });

  // Fetch export history
  const { data: exportHistory = [] } = useQuery({
    queryKey: ["/api/client/export/history"],
  });

  // Create export mutation
  const createExportMutation = useMutation({
    mutationFn: async (data: ExportRequest) => {
      return apiRequest("POST", "/api/client/export/create", data);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/client/export/history"] });
      toast({ 
        title: "Export started successfully", 
        description: "You'll receive an email when your export is ready for download."
      });
    },
    onError: (error: any) => {
      toast({ 
        title: "Export failed", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  // Save template mutation
  const saveTemplateMutation = useMutation({
    mutationFn: async (template: Partial<ExportTemplate>) => {
      return apiRequest("POST", "/api/client/export/templates", template);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/client/export/templates"] });
      toast({ title: "Template saved successfully" });
    },
  });

  // Mock data
  const mockTemplates: ExportTemplate[] = [
    {
      id: "template1",
      name: "Weekly Timesheet Report",
      description: "Complete timesheet data with verification status",
      type: "timesheet",
      format: "excel",
      fields: ["freelancer", "project", "date", "hours", "description", "verification"],
      filters: { status: ["approved"] },
      createdAt: "2024-01-01T00:00:00Z",
      lastUsed: "2024-01-15T10:00:00Z",
      usageCount: 12
    },
    {
      id: "template2",
      name: "Financial Summary",
      description: "Payment and fee breakdown by project",
      type: "financial",
      format: "pdf",
      fields: ["project", "freelancer", "totalPaid", "fees", "netAmount"],
      filters: {},
      createdAt: "2024-01-05T00:00:00Z",
      lastUsed: "2024-01-10T14:00:00Z",
      usageCount: 8
    }
  ];

  const availableFields = {
    timesheet: [
      "freelancer", "employeeId", "project", "date", "startTime", "endTime", 
      "hours", "description", "verification", "approvedBy", "screenshots",
      "keystrokes", "mouseClicks", "productivityScore"
    ],
    financial: [
      "project", "freelancer", "amount", "fees", "netAmount", "paymentDate",
      "paymentMethod", "transactionId", "invoiceId", "currency"
    ],
    performance: [
      "freelancer", "project", "qualityScore", "timelyDelivery", "communication",
      "clientSatisfaction", "overallRating", "completedTasks", "averageHours"
    ],
    comprehensive: [
      "freelancer", "employeeId", "project", "date", "hours", "amount", "verification",
      "qualityScore", "screenshots", "description", "fees", "transactionId"
    ]
  };

  const handleFieldToggle = (field: string) => {
    setSelectedFields(prev => 
      prev.includes(field) 
        ? prev.filter(f => f !== field)
        : [...prev, field]
    );
  };

  const handleQuickExport = () => {
    const request: ExportRequest = {
      name: `Quick Export - ${new Date().toLocaleDateString()}`,
      type: exportType as any,
      format: exportFormat as any,
      dateFrom: dateFrom?.toISOString() || "",
      dateTo: dateTo?.toISOString() || "",
      fields: selectedFields,
      filters: {
        freelancers: selectedFreelancers,
        projects: selectedProjects
      },
      groupBy: groupBy as any,
      includeVerification,
      includeMetadata
    };
    
    createExportMutation.mutate(request);
  };

  const handleSaveTemplate = () => {
    const template: Partial<ExportTemplate> = {
      name: exportName,
      description: `Custom template for ${exportType} export`,
      type: exportType as any,
      format: exportFormat as any,
      fields: selectedFields,
      filters: {
        freelancers: selectedFreelancers,
        projects: selectedProjects
      }
    };
    
    saveTemplateMutation.mutate(template);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'timesheet': return <Clock className="w-4 h-4" />;
      case 'financial': return <DollarSign className="w-4 h-4" />;
      case 'performance': return <TrendingUp className="w-4 h-4" />;
      case 'comprehensive': return <Database className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'csv': return <FileText className="w-4 h-4" />;
      case 'excel': return <FileSpreadsheet className="w-4 h-4" />;
      case 'pdf': return <FileText className="w-4 h-4" />;
      case 'json': return <Database className="w-4 h-4" />;
      default: return <Download className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <ClientNavHeader />
      
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900" data-testid="page-title">
              Custom Export
            </h1>
            <p className="text-gray-600 mt-1">
              Create detailed reports and export your work data in multiple formats
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Preview
            </Button>
            <Button 
              className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
              onClick={handleQuickExport}
              disabled={createExportMutation.isPending}
              data-testid="button-quick-export"
            >
              <Download className="w-4 h-4" />
              {createExportMutation.isPending ? "Exporting..." : "Quick Export"}
            </Button>
          </div>
        </div>

        {/* Export Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Templates</CardTitle>
              <Settings className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="stat-templates">{mockTemplates.length}</div>
              <p className="text-xs text-gray-600">Saved templates</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Month</CardTitle>
              <Download className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="stat-monthly-exports">23</div>
              <p className="text-xs text-gray-600">Exports generated</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Data Points</CardTitle>
              <Database className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="stat-data-points">15.2K</div>
              <p className="text-xs text-gray-600">Available records</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Verified Data</CardTitle>
              <Shield className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600" data-testid="stat-verified-data">98%</div>
              <p className="text-xs text-gray-600">Authentication rate</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Export Interface */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="quick" data-testid="tab-quick">
              Quick Export
            </TabsTrigger>
            <TabsTrigger value="custom" data-testid="tab-custom">
              Custom Export
            </TabsTrigger>
            <TabsTrigger value="templates" data-testid="tab-templates">
              Templates ({mockTemplates.length})
            </TabsTrigger>
          </TabsList>

          {/* Quick Export Tab */}
          <TabsContent value="quick" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Quick Export Settings</CardTitle>
                <CardDescription>
                  Generate common reports with predefined settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="export-type">Export Type</Label>
                      <Select value={exportType} onValueChange={setExportType}>
                        <SelectTrigger data-testid="select-export-type">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="timesheet">
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4" />
                              Timesheet Data
                            </div>
                          </SelectItem>
                          <SelectItem value="financial">
                            <div className="flex items-center gap-2">
                              <DollarSign className="w-4 h-4" />
                              Financial Reports
                            </div>
                          </SelectItem>
                          <SelectItem value="performance">
                            <div className="flex items-center gap-2">
                              <TrendingUp className="w-4 h-4" />
                              Performance Metrics
                            </div>
                          </SelectItem>
                          <SelectItem value="comprehensive">
                            <div className="flex items-center gap-2">
                              <Database className="w-4 h-4" />
                              Comprehensive Report
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="export-format">Export Format</Label>
                      <Select value={exportFormat} onValueChange={setExportFormat}>
                        <SelectTrigger data-testid="select-export-format">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="csv">CSV (Excel Compatible)</SelectItem>
                          <SelectItem value="excel">Excel Spreadsheet</SelectItem>
                          <SelectItem value="pdf">PDF Report</SelectItem>
                          <SelectItem value="json">JSON Data</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label>Date Range</Label>
                      <div className="flex gap-2">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full justify-start text-left font-normal">
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {dateFrom ? dateFrom.toLocaleDateString() : "From date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={dateFrom}
                              onSelect={setDateFrom}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>

                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full justify-start text-left font-normal">
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {dateTo ? dateTo.toLocaleDateString() : "To date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={dateTo}
                              onSelect={setDateTo}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label>Options</Label>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="include-verification"
                            checked={includeVerification}
                            onCheckedChange={setIncludeVerification}
                          />
                          <Label htmlFor="include-verification" className="text-sm">
                            Include verification details
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="include-metadata"
                            checked={includeMetadata}
                            onCheckedChange={setIncludeMetadata}
                          />
                          <Label htmlFor="include-metadata" className="text-sm">
                            Include technical metadata
                          </Label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Custom Export Tab */}
          <TabsContent value="custom" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Advanced Export Configuration</CardTitle>
                <CardDescription>
                  Customize every aspect of your export with detailed field selection
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="export-name">Export Name</Label>
                      <Input
                        id="export-name"
                        placeholder="My Custom Export"
                        value={exportName}
                        onChange={(e) => setExportName(e.target.value)}
                        data-testid="input-export-name"
                      />
                    </div>

                    <div>
                      <Label>Group By</Label>
                      <Select value={groupBy} onValueChange={setGroupBy}>
                        <SelectTrigger>
                          <SelectValue placeholder="No grouping" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">No Grouping</SelectItem>
                          <SelectItem value="freelancer">Group by Freelancer</SelectItem>
                          <SelectItem value="project">Group by Project</SelectItem>
                          <SelectItem value="date">Group by Date</SelectItem>
                          <SelectItem value="status">Group by Status</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-3">
                      <Label>Security Options</Label>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="compression"
                            checked={compression}
                            onCheckedChange={setCompression}
                          />
                          <Label htmlFor="compression" className="text-sm">
                            Enable compression
                          </Label>
                        </div>
                        <div>
                          <Label htmlFor="password" className="text-sm">Password protection (optional)</Label>
                          <Input
                            id="password"
                            type="password"
                            placeholder="Enter password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label>Select Fields to Include</Label>
                      <div className="border rounded-lg p-4 max-h-64 overflow-y-auto">
                        <div className="space-y-2">
                          {availableFields[exportType as keyof typeof availableFields]?.map((field) => (
                            <div key={field} className="flex items-center space-x-2">
                              <Checkbox
                                id={field}
                                checked={selectedFields.includes(field)}
                                onCheckedChange={() => handleFieldToggle(field)}
                              />
                              <Label htmlFor={field} className="text-sm capitalize">
                                {field.replace(/([A-Z])/g, ' $1')}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={handleSaveTemplate}>
                    <Settings className="w-4 h-4 mr-2" />
                    Save as Template
                  </Button>
                  <Button 
                    onClick={handleQuickExport}
                    disabled={createExportMutation.isPending}
                    data-testid="button-custom-export"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    {createExportMutation.isPending ? "Creating Export..." : "Create Export"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Templates Tab */}
          <TabsContent value="templates" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {mockTemplates.map((template) => (
                <Card key={template.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2" data-testid={`template-name-${template.id}`}>
                          {getTypeIcon(template.type)}
                          {template.name}
                        </CardTitle>
                        <CardDescription>{template.description}</CardDescription>
                      </div>
                      <Badge variant="outline" className="flex items-center gap-1">
                        {getFormatIcon(template.format)}
                        {template.format.toUpperCase()}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Type:</span>
                          <div className="font-medium capitalize">{template.type}</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Fields:</span>
                          <div className="font-medium">{template.fields.length} selected</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Usage:</span>
                          <div className="font-medium">{template.usageCount} times</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Last used:</span>
                          <div className="font-medium">
                            {template.lastUsed ? new Date(template.lastUsed).toLocaleDateString() : 'Never'}
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-between">
                        <Button variant="outline" size="sm" data-testid={`button-edit-${template.id}`}>
                          <Copy className="w-4 h-4 mr-1" />
                          Clone
                        </Button>
                        <Button size="sm" data-testid={`button-use-${template.id}`}>
                          <Download className="w-4 h-4 mr-1" />
                          Use Template
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Signedwork Export Advantage */}
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-green-900">Signedwork Verified Export Data</h3>
                <p className="text-green-700">Every exported record includes fraud-proof verification chains</p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="text-green-800">
                <strong>Multi-Level Verification:</strong> Team Lead → Branch Manager → Company Admin approval chains
              </div>
              <div className="text-green-800">
                <strong>Authentic Work Hours:</strong> Screenshot, keystroke, and activity verification
              </div>
              <div className="text-green-800">
                <strong>Immutable Records:</strong> Blockchain-style verification preventing data tampering
              </div>
              <div className="text-green-800">
                <strong>Audit-Ready Reports:</strong> Complete compliance documentation included
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}