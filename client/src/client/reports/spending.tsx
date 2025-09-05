import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { 
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar as CalendarIcon,
  Download,
  PieChart,
  BarChart3,
  Filter,
  Search,
  Users,
  Clock,
  Target,
  AlertTriangle,
  CheckCircle,
  Zap,
  Shield,
  Award,
  ArrowUpRight,
  ArrowDownLeft,
  Eye,
  FileText
} from "lucide-react";
import { Link } from "wouter";
import ClientNavHeader from "@/components/client-nav-header";

interface SpendingCategory {
  category: string;
  amount: number;
  percentage: number;
  change: number;
  projects: number;
  freelancers: number;
  color: string;
}

interface ProjectSpending {
  id: string;
  title: string;
  category: string;
  totalBudget: number;
  spent: number;
  remaining: number;
  percentageUsed: number;
  freelancers: number;
  status: 'active' | 'completed' | 'paused' | 'over_budget';
  startDate: string;
  endDate?: string;
  hourlyRate: number;
  hoursWorked: number;
  lastActivity: string;
  verificationRate: number;
}

interface FreelancerSpending {
  id: string;
  employeeId: string;
  name: string;
  title: string;
  profilePhoto?: string;
  totalPaid: number;
  hoursWorked: number;
  averageHourlyRate: number;
  projects: number;
  lastPayment: string;
  verificationLevel: 'verified' | 'company_verified' | 'basic';
  verifiedHours: number;
  performanceScore: number;
  status: 'active' | 'completed';
}

export default function SpendingByActivity() {
  const [activeTab, setActiveTab] = useState("overview");
  const [dateRange, setDateRange] = useState("month");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  // Fetch spending data
  const { data: spendingData, isLoading } = useQuery({
    queryKey: ["/api/client/reports/spending", { 
      dateRange, 
      category: categoryFilter,
      search: searchTerm 
    }],
  });

  // Mock data for demonstration
  const mockSpendingCategories: SpendingCategory[] = [
    {
      category: "Web Development",
      amount: 15420,
      percentage: 45.2,
      change: 12.5,
      projects: 8,
      freelancers: 5,
      color: "bg-blue-500"
    },
    {
      category: "Design & Creative",
      amount: 8750,
      percentage: 25.6,
      change: -3.2,
      projects: 4,
      freelancers: 3,
      color: "bg-purple-500"
    },
    {
      category: "Mobile Development",
      amount: 6300,
      percentage: 18.4,
      change: 8.1,
      projects: 3,
      freelancers: 2,
      color: "bg-green-500"
    },
    {
      category: "Data & Analytics",
      amount: 3680,
      percentage: 10.8,
      change: 15.7,
      projects: 2,
      freelancers: 2,
      color: "bg-orange-500"
    }
  ];

  const mockProjectSpending: ProjectSpending[] = [
    {
      id: "project1",
      title: "React E-commerce Platform",
      category: "Web Development",
      totalBudget: 15000,
      spent: 8500,
      remaining: 6500,
      percentageUsed: 56.7,
      freelancers: 2,
      status: "active",
      startDate: "2024-01-01",
      hourlyRate: 85,
      hoursWorked: 100,
      lastActivity: "2 hours ago",
      verificationRate: 98
    },
    {
      id: "project2",
      title: "Mobile App Design",
      category: "Design & Creative",
      totalBudget: 5000,
      spent: 5000,
      remaining: 0,
      percentageUsed: 100,
      freelancers: 1,
      status: "completed",
      startDate: "2023-12-15",
      endDate: "2024-01-15",
      hourlyRate: 65,
      hoursWorked: 77,
      lastActivity: "5 days ago",
      verificationRate: 100
    },
    {
      id: "project3",
      title: "Data Analytics Dashboard",
      category: "Data & Analytics",
      totalBudget: 8000,
      spent: 9200,
      remaining: -1200,
      percentageUsed: 115,
      freelancers: 1,
      status: "over_budget",
      startDate: "2023-11-01",
      hourlyRate: 95,
      hoursWorked: 97,
      lastActivity: "1 day ago",
      verificationRate: 95
    }
  ];

  const mockFreelancerSpending: FreelancerSpending[] = [
    {
      id: "freelancer1",
      employeeId: "EMP-ABC123",
      name: "Sarah Johnson",
      title: "Senior React Developer",
      profilePhoto: "",
      totalPaid: 8500,
      hoursWorked: 100,
      averageHourlyRate: 85,
      projects: 2,
      lastPayment: "2024-01-15",
      verificationLevel: "verified",
      verifiedHours: 95,
      performanceScore: 98,
      status: "active"
    },
    {
      id: "freelancer2",
      employeeId: "EMP-DEF456",
      name: "Michael Chen",
      title: "Senior UI/UX Designer",
      profilePhoto: "",
      totalPaid: 5000,
      hoursWorked: 77,
      averageHourlyRate: 65,
      projects: 1,
      lastPayment: "2024-01-14",
      verificationLevel: "company_verified",
      verifiedHours: 77,
      performanceScore: 96,
      status: "completed"
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'over_budget': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getVerificationBadge = (level: string) => {
    switch (level) {
      case 'verified':
        return (
          <Badge className="bg-green-100 text-green-800 flex items-center gap-1">
            <Shield className="w-3 h-3" />
            Verified ⭐⭐⭐
          </Badge>
        );
      case 'company_verified':
        return (
          <Badge className="bg-blue-100 text-blue-800 flex items-center gap-1">
            <Award className="w-3 h-3" />
            Company Verified ⭐⭐
          </Badge>
        );
      default:
        return null;
    }
  };

  const getTrendIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (change < 0) return <TrendingDown className="w-4 h-4 text-red-600" />;
    return <BarChart3 className="w-4 h-4 text-gray-600" />;
  };

  const totalSpent = mockSpendingCategories.reduce((sum, cat) => sum + cat.amount, 0);
  const totalProjects = mockProjectSpending.length;
  const activeProjects = mockProjectSpending.filter(p => p.status === 'active').length;
  const overBudgetProjects = mockProjectSpending.filter(p => p.status === 'over_budget').length;

  const filteredProjects = mockProjectSpending.filter(project => 
    project.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (categoryFilter === "all" || project.category === categoryFilter)
  );

  const filteredFreelancers = mockFreelancerSpending.filter(freelancer =>
    freelancer.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <ClientNavHeader />
      
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900" data-testid="page-title">
              Spending by Activity
            </h1>
            <p className="text-gray-600 mt-1">
              Analyze spending patterns across projects, categories, and freelancers
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export Report
            </Button>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4" />
                  {dateRange === "week" ? "This Week" : "This Month"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="stat-total-spent">${totalSpent.toLocaleString()}</div>
              <p className="text-xs text-gray-600">All projects</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
              <Target className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="stat-active-projects">{activeProjects}</div>
              <p className="text-xs text-gray-600">Out of {totalProjects} total</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Budget Alerts</CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600" data-testid="stat-budget-alerts">{overBudgetProjects}</div>
              <p className="text-xs text-gray-600">Over budget</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Hourly Rate</CardTitle>
              <Clock className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="stat-avg-hourly">$78</div>
              <p className="text-xs text-gray-600">Across all freelancers</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Filter Spending Data</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search projects, freelancers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="search-spending"
                />
              </div>
              
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger data-testid="filter-category">
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="Web Development">Web Development</SelectItem>
                  <SelectItem value="Design & Creative">Design & Creative</SelectItem>
                  <SelectItem value="Mobile Development">Mobile Development</SelectItem>
                  <SelectItem value="Data & Analytics">Data & Analytics</SelectItem>
                </SelectContent>
              </Select>

              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger data-testid="filter-date-range">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="quarter">This Quarter</SelectItem>
                  <SelectItem value="year">This Year</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" className="flex items-center">
                <Filter className="w-4 h-4 mr-2" />
                Advanced
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" data-testid="tab-overview">
              Overview
            </TabsTrigger>
            <TabsTrigger value="categories" data-testid="tab-categories">
              By Category
            </TabsTrigger>
            <TabsTrigger value="projects" data-testid="tab-projects">
              By Project ({filteredProjects.length})
            </TabsTrigger>
            <TabsTrigger value="freelancers" data-testid="tab-freelancers">
              By Freelancer ({filteredFreelancers.length})
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Spending by Category Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="w-5 h-5" />
                    Spending Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockSpendingCategories.map((category, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">{category.category}</span>
                          <span className="text-gray-600">{category.percentage}%</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Progress value={category.percentage} className="flex-1" />
                          <span className="text-sm font-medium">${category.amount.toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Top Projects */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Top Spending Projects
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockProjectSpending.slice(0, 3).map((project) => (
                      <div key={project.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <h4 className="font-medium text-gray-900">{project.title}</h4>
                          <p className="text-sm text-gray-600">{project.category}</p>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-gray-900">${project.spent.toLocaleString()}</div>
                          <div className="text-sm text-gray-600">{project.percentageUsed.toFixed(0)}% used</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Categories Tab */}
          <TabsContent value="categories" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {mockSpendingCategories.map((category, index) => (
                <Card key={index} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900" data-testid={`category-name-${index}`}>
                          {category.category}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm text-gray-600">{category.projects} projects</span>
                          <span className="text-gray-400">•</span>
                          <span className="text-sm text-gray-600">{category.freelancers} freelancers</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-gray-900">${category.amount.toLocaleString()}</div>
                        <div className="flex items-center gap-1 text-sm">
                          {getTrendIcon(category.change)}
                          <span className={category.change >= 0 ? 'text-green-600' : 'text-red-600'}>
                            {category.change >= 0 ? '+' : ''}{category.change.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Percentage of total</span>
                        <span className="font-medium">{category.percentage}%</span>
                      </div>
                      <Progress value={category.percentage} className="h-2" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Projects Tab */}
          <TabsContent value="projects" className="space-y-4">
            {filteredProjects.map((project) => (
              <Card key={project.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Link href={`/client/projects/${project.id}`}>
                          <h3 className="text-lg font-semibold text-blue-600 hover:underline" data-testid={`project-title-${project.id}`}>
                            {project.title}
                          </h3>
                        </Link>
                        <Badge className={getStatusColor(project.status)}>
                          {project.status.replace('_', ' ')}
                        </Badge>
                        <Badge variant="outline">{project.category}</Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                        <div>
                          <p className="text-gray-500">Budget</p>
                          <p className="font-medium">${project.totalBudget.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Spent</p>
                          <p className={`font-medium ${project.status === 'over_budget' ? 'text-red-600' : 'text-gray-900'}`}>
                            ${project.spent.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">Remaining</p>
                          <p className={`font-medium ${project.remaining < 0 ? 'text-red-600' : 'text-green-600'}`}>
                            ${Math.abs(project.remaining).toLocaleString()} {project.remaining < 0 ? 'over' : 'left'}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">Hours Worked</p>
                          <p className="font-medium">{project.hoursWorked}h</p>
                        </div>
                      </div>

                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-sm">
                          <span>Budget Usage</span>
                          <span className={`font-medium ${project.percentageUsed > 100 ? 'text-red-600' : 'text-gray-900'}`}>
                            {project.percentageUsed.toFixed(1)}%
                          </span>
                        </div>
                        <Progress 
                          value={Math.min(project.percentageUsed, 100)} 
                          className={`h-2 ${project.percentageUsed > 100 ? 'bg-red-100' : ''}`}
                        />
                        {project.percentageUsed > 100 && (
                          <div className="flex items-center gap-1 text-red-600 text-sm">
                            <AlertTriangle className="w-4 h-4" />
                            <span>Over budget by ${(project.spent - project.totalBudget).toLocaleString()}</span>
                          </div>
                        )}
                      </div>

                      {/* Signedwork Verification */}
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2 text-green-800">
                            <Shield className="w-4 h-4" />
                            <span>Signedwork Verification: {project.verificationRate}%</span>
                          </div>
                          <span className="text-green-700">{project.freelancers} verified freelancer{project.freelancers !== 1 ? 's' : ''}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right ml-4">
                      <div className="text-2xl font-bold text-gray-900">${project.spent.toLocaleString()}</div>
                      <div className="text-sm text-gray-600">of ${project.totalBudget.toLocaleString()}</div>
                      <div className="mt-2 text-xs text-gray-500">
                        Last activity: {project.lastActivity}
                      </div>
                      
                      <div className="mt-3 space-y-2">
                        <Link href={`/client/projects/${project.id}`}>
                          <Button variant="outline" size="sm" className="w-full" data-testid={`button-view-${project.id}`}>
                            <Eye className="w-4 h-4 mr-1" />
                            View Details
                          </Button>
                        </Link>
                        <Link href={`/client/work/timesheets?project=${project.id}`}>
                          <Button variant="outline" size="sm" className="w-full" data-testid={`button-timesheets-${project.id}`}>
                            <FileText className="w-4 h-4 mr-1" />
                            Timesheets
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Freelancers Tab */}
          <TabsContent value="freelancers" className="space-y-4">
            {filteredFreelancers.map((freelancer) => (
              <Card key={freelancer.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-lg font-semibold text-gray-600">
                        {freelancer.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Link href={`/freelancers/${freelancer.id}`}>
                          <h3 className="text-lg font-semibold text-blue-600 hover:underline" data-testid={`freelancer-name-${freelancer.id}`}>
                            {freelancer.name}
                          </h3>
                        </Link>
                        {getVerificationBadge(freelancer.verificationLevel)}
                        <Badge className={getStatusColor(freelancer.status)}>
                          {freelancer.status}
                        </Badge>
                      </div>
                      
                      <p className="text-gray-700 mb-3">{freelancer.title} • ID: {freelancer.employeeId}</p>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                        <div>
                          <p className="text-gray-500">Total Paid</p>
                          <p className="font-medium text-lg">${freelancer.totalPaid.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Hours Worked</p>
                          <p className="font-medium">{freelancer.hoursWorked}h</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Avg Rate</p>
                          <p className="font-medium">${freelancer.averageHourlyRate}/hr</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Projects</p>
                          <p className="font-medium">{freelancer.projects}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">Verified Hours</p>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-green-600">{freelancer.verifiedHours}h</p>
                            <span className="text-gray-600">({((freelancer.verifiedHours / freelancer.hoursWorked) * 100).toFixed(0)}%)</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-gray-500">Performance Score</p>
                          <p className="font-medium text-green-600">{freelancer.performanceScore}%</p>
                        </div>
                      </div>

                      {/* Signedwork Verification */}
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-4">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2 text-green-800">
                            <Shield className="w-4 h-4" />
                            <span>All work hours fraud-proof verified</span>
                          </div>
                          <span className="text-green-700">Last payment: {new Date(freelancer.lastPayment).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900">${freelancer.totalPaid.toLocaleString()}</div>
                      <div className="text-sm text-gray-600">Total earnings</div>
                      
                      <div className="mt-3 space-y-2">
                        <Link href={`/freelancers/${freelancer.id}`}>
                          <Button variant="outline" size="sm" className="w-full" data-testid={`button-view-freelancer-${freelancer.id}`}>
                            <Eye className="w-4 h-4 mr-1" />
                            View Profile
                          </Button>
                        </Link>
                        <Link href={`/client/work/timesheets?freelancer=${freelancer.id}`}>
                          <Button variant="outline" size="sm" className="w-full" data-testid={`button-freelancer-timesheets-${freelancer.id}`}>
                            <FileText className="w-4 h-4 mr-1" />
                            Timesheets
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>

        {/* Signedwork Advantage */}
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-green-900">Signedwork Transparent Spending Analytics</h3>
                <p className="text-green-700">Complete visibility into verified work spending with fraud-proof tracking</p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="text-green-800">
                <strong>Real-time Tracking:</strong> Live spending updates as work is completed
              </div>
              <div className="text-green-800">
                <strong>Verified Hours Only:</strong> Pay only for authenticated, verified work time
              </div>
              <div className="text-green-800">
                <strong>Budget Alerts:</strong> Proactive notifications before overspending
              </div>
              <div className="text-green-800">
                <strong>Audit Trail:</strong> Complete transaction history with verification chains
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}