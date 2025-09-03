import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  Download,
  BarChart3,
  PieChart,
  Users,
  Clock,
  Shield
} from "lucide-react";
import ClientNavHeader from "@/components/client-nav-header";

export default function FinancialSummary() {
  const [timePeriod, setTimePeriod] = useState("week");

  // Fetch financial data
  const { data: financialData, isLoading } = useQuery({
    queryKey: ["/api/client/reports/financial", { period: timePeriod }],
  });

  const weeklyData = {
    totalSpent: 5240,
    totalContracts: 8,
    avgContractValue: 655,
    verifiedHours: 142,
    topCategories: [
      { name: "Web Development", amount: 2100, percentage: 40 },
      { name: "Design & Creative", amount: 1570, percentage: 30 },
      { name: "Writing", amount: 1050, percentage: 20 },
      { name: "Marketing", amount: 520, percentage: 10 }
    ],
    weeklyBreakdown: [
      { week: "Week 1", amount: 1200, contracts: 2 },
      { week: "Week 2", amount: 1800, contracts: 3 },
      { week: "Week 3", amount: 1340, contracts: 2 },
      { week: "Week 4", amount: 900, contracts: 1 }
    ],
    topFreelancers: [
      { name: "John Smith", amount: 1200, hours: 32, verifiedHours: 32 },
      { name: "Sarah Johnson", amount: 980, hours: 28, verifiedHours: 26 },
      { name: "Mike Chen", amount: 750, hours: 25, verifiedHours: 25 }
    ]
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <ClientNavHeader />
      
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900" data-testid="page-title">
              Weekly Financial Summary
            </h1>
            <p className="text-gray-600 mt-1">
              Track your spending and get insights into your freelance investments
            </p>
          </div>
          <div className="flex gap-2">
            <Select value={timePeriod} onValueChange={setTimePeriod}>
              <SelectTrigger className="w-40" data-testid="period-selector">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="quarter">This Quarter</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export PDF
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
              <DollarSign className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="total-spent">${weeklyData.totalSpent.toLocaleString()}</div>
              <div className="flex items-center text-xs text-green-600 mt-1">
                <TrendingUp className="w-3 h-3 mr-1" />
                +12% from last week
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Contracts</CardTitle>
              <Users className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="total-contracts">{weeklyData.totalContracts}</div>
              <div className="flex items-center text-xs text-green-600 mt-1">
                <TrendingUp className="w-3 h-3 mr-1" />
                +2 new this week
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Contract Value</CardTitle>
              <BarChart3 className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="avg-contract">${weeklyData.avgContractValue}</div>
              <div className="flex items-center text-xs text-red-600 mt-1">
                <TrendingDown className="w-3 h-3 mr-1" />
                -5% from last week
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Verified Hours</CardTitle>
              <Shield className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="verified-hours">{weeklyData.verifiedHours}</div>
              <p className="text-xs text-gray-600">100% authentication rate ⭐</p>
            </CardContent>
          </Card>
        </div>

        {/* Spending by Category */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="w-5 h-5" />
              Spending by Category
            </CardTitle>
            <CardDescription>Where your freelance budget is being invested</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {weeklyData.topCategories.map((category, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full bg-blue-600" style={{
                      backgroundColor: `hsl(${index * 90}, 70%, 50%)`
                    }} />
                    <span className="font-medium">{category.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">${category.amount.toLocaleString()}</div>
                    <div className="text-sm text-gray-500">{category.percentage}%</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Weekly Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Weekly Spending Breakdown
            </CardTitle>
            <CardDescription>Your spending patterns over the last 4 weeks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {weeklyData.weeklyBreakdown.map((week, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">{week.week}</div>
                    <div className="text-sm text-gray-500">{week.contracts} contracts</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">${week.amount.toLocaleString()}</div>
                    <div className="text-sm text-gray-500">
                      Avg: ${Math.round(week.amount / week.contracts).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Performing Freelancers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Top Freelancers This Week
            </CardTitle>
            <CardDescription>Freelancers with verified work and highest investment</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {weeklyData.topFreelancers.map((freelancer, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center font-semibold">
                      {freelancer.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <div className="font-medium">{freelancer.name}</div>
                      <div className="text-sm text-gray-500">
                        {freelancer.hours} hrs total · {freelancer.verifiedHours} verified
                      </div>
                    </div>
                    {freelancer.hours === freelancer.verifiedHours && (
                      <Badge className="bg-green-100 text-green-800">
                        <Shield className="w-3 h-3 mr-1" />
                        100% Verified
                      </Badge>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">${freelancer.amount.toLocaleString()}</div>
                    <div className="text-sm text-gray-500">
                      ${Math.round(freelancer.amount / freelancer.hours)}/hr
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Verification Insights */}
        <Card className="bg-green-50 border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <Shield className="w-5 h-5" />
              Signedwork Verification Advantage
            </CardTitle>
            <CardDescription className="text-green-700">
              See how our verified work diary system protects your investment
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-800">100%</div>
                <div className="text-sm text-green-600">Work Verification Rate</div>
                <div className="text-xs text-gray-600 mt-1">All hours authenticated</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-800">0</div>
                <div className="text-sm text-green-600">Fraudulent Claims</div>
                <div className="text-xs text-gray-600 mt-1">Multi-level verification</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-800">$520</div>
                <div className="text-sm text-green-600">Saved vs Upwork Fees</div>
                <div className="text-xs text-gray-600 mt-1">2% flat rate advantage</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}