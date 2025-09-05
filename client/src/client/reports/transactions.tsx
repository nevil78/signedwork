import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { 
  DollarSign,
  Search,
  Filter,
  Calendar as CalendarIcon,
  Download,
  TrendingUp,
  TrendingDown,
  CreditCard,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle,
  Receipt,
  FileText,
  Eye,
  RefreshCw,
  Banknote,
  Zap
} from "lucide-react";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import ClientNavHeader from "@/components/client-nav-header";

interface Transaction {
  id: string;
  type: 'payment_sent' | 'payment_received' | 'refund' | 'fee' | 'withdrawal' | 'deposit';
  status: 'completed' | 'pending' | 'failed' | 'cancelled' | 'processing';
  amount: number;
  currency: 'USD';
  description: string;
  date: string;
  freelancer?: {
    id: string;
    firstName: string;
    lastName: string;
    profilePhoto?: string;
    employeeId: string;
  };
  project?: {
    id: string;
    title: string;
  };
  contract?: {
    id: string;
    type: 'hourly' | 'fixed_price';
  };
  paymentMethod: {
    type: 'credit_card' | 'bank_account' | 'paypal' | 'wire_transfer';
    last4?: string;
    brand?: string;
  };
  fees: {
    signedworkFee: number;
    processingFee: number;
    totalFees: number;
  };
  reference: string;
  invoiceId?: string;
  receiptUrl?: string;
  notes?: string;
  metadata: {
    ip?: string;
    userAgent?: string;
    location?: string;
    workHours?: number;
    milestone?: string;
  };
}

export default function TransactionHistory() {
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateRange, setDateRange] = useState("month");
  const [selectedDateFrom, setSelectedDateFrom] = useState<Date | undefined>();
  const [selectedDateTo, setSelectedDateTo] = useState<Date | undefined>();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch transaction history
  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ["/api/client/reports/transactions", { 
      search: searchTerm,
      type: typeFilter,
      status: statusFilter,
      dateRange: dateRange,
      tab: activeTab
    }],
  });

  // Download receipt mutation
  const downloadReceiptMutation = useMutation({
    mutationFn: async (transactionId: string) => {
      return apiRequest("GET", `/api/client/transactions/${transactionId}/receipt`);
    },
    onSuccess: () => {
      toast({ title: "Receipt downloaded successfully" });
    },
  });

  // Mock data for demonstration
  const mockTransactions: Transaction[] = [
    {
      id: "txn_001",
      type: "payment_sent",
      status: "completed",
      amount: 573.75,
      currency: "USD",
      description: "Payment for React E-commerce Platform development work",
      date: "2024-01-15T18:30:00Z",
      freelancer: {
        id: "freelancer1",
        firstName: "Sarah",
        lastName: "Johnson",
        profilePhoto: "",
        employeeId: "EMP-ABC123"
      },
      project: {
        id: "project1",
        title: "React E-commerce Platform"
      },
      contract: {
        id: "contract1",
        type: "hourly"
      },
      paymentMethod: {
        type: "credit_card",
        last4: "4242",
        brand: "Visa"
      },
      fees: {
        signedworkFee: 11.48,
        processingFee: 17.21,
        totalFees: 28.69
      },
      reference: "REF-2024-001",
      invoiceId: "INV-001",
      receiptUrl: "/receipts/txn_001.pdf",
      metadata: {
        workHours: 6.75,
        milestone: "Payment Integration Complete"
      }
    },
    {
      id: "txn_002",
      type: "payment_sent", 
      status: "completed",
      amount: 292.50,
      currency: "USD",
      description: "Payment for Mobile App Design project completion",
      date: "2024-01-14T16:45:00Z",
      freelancer: {
        id: "freelancer2",
        firstName: "Michael",
        lastName: "Chen",
        profilePhoto: "",
        employeeId: "EMP-DEF456"
      },
      project: {
        id: "project2",
        title: "Mobile App Design"
      },
      contract: {
        id: "contract2",
        type: "fixed_price"
      },
      paymentMethod: {
        type: "bank_account",
        last4: "7890"
      },
      fees: {
        signedworkFee: 5.85,
        processingFee: 8.78,
        totalFees: 14.63
      },
      reference: "REF-2024-002",
      invoiceId: "INV-002",
      receiptUrl: "/receipts/txn_002.pdf",
      metadata: {
        workHours: 4.5,
        milestone: "Final Design Deliverables"
      }
    },
    {
      id: "txn_003",
      type: "fee",
      status: "completed",
      amount: 11.48,
      currency: "USD",
      description: "Signedwork platform fee (2%)",
      date: "2024-01-15T18:35:00Z",
      paymentMethod: {
        type: "credit_card",
        last4: "4242",
        brand: "Visa"
      },
      fees: {
        signedworkFee: 11.48,
        processingFee: 0,
        totalFees: 11.48
      },
      reference: "FEE-2024-001"
    },
    {
      id: "txn_004",
      type: "deposit",
      status: "pending",
      amount: 1000.00,
      currency: "USD",
      description: "Account deposit for upcoming projects",
      date: "2024-01-20T10:00:00Z",
      paymentMethod: {
        type: "wire_transfer"
      },
      fees: {
        signedworkFee: 0,
        processingFee: 25.00,
        totalFees: 25.00
      },
      reference: "DEP-2024-001"
    }
  ];

  const getTransactionIcon = (type: string, status: string) => {
    if (status === 'failed') return <XCircle className="w-5 h-5 text-red-600" />;
    if (status === 'pending') return <Clock className="w-5 h-5 text-yellow-600" />;
    
    switch (type) {
      case 'payment_sent': return <ArrowUpRight className="w-5 h-5 text-red-600" />;
      case 'payment_received': return <ArrowDownLeft className="w-5 h-5 text-green-600" />;
      case 'refund': return <RefreshCw className="w-5 h-5 text-blue-600" />;
      case 'fee': return <Zap className="w-5 h-5 text-purple-600" />;
      case 'withdrawal': return <Banknote className="w-5 h-5 text-orange-600" />;
      case 'deposit': return <DollarSign className="w-5 h-5 text-green-600" />;
      default: return <Receipt className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'payment_sent': return 'Payment Sent';
      case 'payment_received': return 'Payment Received';
      case 'refund': return 'Refund';
      case 'fee': return 'Platform Fee';
      case 'withdrawal': return 'Withdrawal';
      case 'deposit': return 'Deposit';
      default: return type;
    }
  };

  const getPaymentMethodIcon = (type: string) => {
    switch (type) {
      case 'credit_card': return <CreditCard className="w-4 h-4" />;
      case 'bank_account': return <Banknote className="w-4 h-4" />;
      case 'paypal': return <DollarSign className="w-4 h-4" />;
      case 'wire_transfer': return <ArrowUpRight className="w-4 h-4" />;
      default: return <Receipt className="w-4 h-4" />;
    }
  };

  const formatPaymentMethod = (method: Transaction['paymentMethod']) => {
    switch (method.type) {
      case 'credit_card':
        return `${method.brand} •••• ${method.last4}`;
      case 'bank_account':
        return `Bank Account •••• ${method.last4}`;
      case 'paypal':
        return 'PayPal';
      case 'wire_transfer':
        return 'Wire Transfer';
      default:
        return method.type;
    }
  };

  const filteredTransactions = mockTransactions.filter(transaction => {
    const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (transaction.freelancer && `${transaction.freelancer.firstName} ${transaction.freelancer.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesTab = activeTab === "all" || 
                      (activeTab === "payments" && ["payment_sent", "payment_received"].includes(transaction.type)) ||
                      (activeTab === "fees" && transaction.type === "fee") ||
                      (activeTab === "deposits" && ["deposit", "withdrawal"].includes(transaction.type));
    
    const matchesType = typeFilter === "all" || transaction.type === typeFilter;
    const matchesStatus = statusFilter === "all" || transaction.status === statusFilter;
    
    return matchesSearch && matchesTab && matchesType && matchesStatus;
  });

  const payments = filteredTransactions.filter(t => ["payment_sent", "payment_received"].includes(t.type));
  const fees = filteredTransactions.filter(t => t.type === "fee");
  const deposits = filteredTransactions.filter(t => ["deposit", "withdrawal"].includes(t.type));

  const totalAmount = filteredTransactions.reduce((sum, t) => {
    if (t.type === 'payment_sent' || t.type === 'fee' || t.type === 'withdrawal') {
      return sum - t.amount;
    }
    return sum + t.amount;
  }, 0);

  const totalPaid = filteredTransactions.filter(t => t.type === 'payment_sent').reduce((sum, t) => sum + t.amount, 0);
  const totalFees = filteredTransactions.reduce((sum, t) => sum + t.fees.signedworkFee, 0);
  const pendingTransactions = filteredTransactions.filter(t => t.status === 'pending').length;

  return (
    <div className="min-h-screen bg-gray-50">
      <ClientNavHeader />
      
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900" data-testid="page-title">
              Transaction History
            </h1>
            <p className="text-gray-600 mt-1">
              Complete record of all payments, fees, and financial transactions
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export CSV
            </Button>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4" />
                  Date Range
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={selectedDateFrom}
                  onSelect={setSelectedDateFrom}
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
              <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
              <ArrowUpRight className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600" data-testid="stat-total-paid">
                ${totalPaid.toLocaleString()}
              </div>
              <p className="text-xs text-gray-600">To freelancers</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Platform Fees</CardTitle>
              <Zap className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600" data-testid="stat-total-fees">
                ${totalFees.toLocaleString()}
              </div>
              <p className="text-xs text-gray-600">2% Signedwork fee</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Net Balance</CardTitle>
              {totalAmount >= 0 ? <TrendingUp className="h-4 w-4 text-green-600" /> : <TrendingDown className="h-4 w-4 text-red-600" />}
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${totalAmount >= 0 ? 'text-green-600' : 'text-red-600'}`} data-testid="stat-net-balance">
                ${Math.abs(totalAmount).toLocaleString()}
              </div>
              <p className="text-xs text-gray-600">{totalAmount >= 0 ? 'Credit' : 'Debit'}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600" data-testid="stat-pending">
                {pendingTransactions}
              </div>
              <p className="text-xs text-gray-600">Transactions</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Filter Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="search-transactions"
                />
              </div>
              
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger data-testid="filter-type">
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="payment_sent">Payment Sent</SelectItem>
                  <SelectItem value="payment_received">Payment Received</SelectItem>
                  <SelectItem value="fee">Platform Fee</SelectItem>
                  <SelectItem value="deposit">Deposit</SelectItem>
                  <SelectItem value="withdrawal">Withdrawal</SelectItem>
                  <SelectItem value="refund">Refund</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger data-testid="filter-status">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
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
                  <SelectItem value="all">All Time</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" className="flex items-center">
                <Filter className="w-4 h-4 mr-2" />
                Advanced
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Transaction Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all" data-testid="tab-all">
              All ({filteredTransactions.length})
            </TabsTrigger>
            <TabsTrigger value="payments" data-testid="tab-payments">
              Payments ({payments.length})
            </TabsTrigger>
            <TabsTrigger value="fees" data-testid="tab-fees">
              Fees ({fees.length})
            </TabsTrigger>
            <TabsTrigger value="deposits" data-testid="tab-deposits">
              Deposits ({deposits.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-4">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i}>
                    <CardContent className="p-6">
                      <div className="space-y-3">
                        <div className="h-6 bg-gray-200 rounded animate-pulse" />
                        <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
                        <div className="flex space-x-2">
                          <div className="h-4 bg-gray-200 rounded animate-pulse w-20" />
                          <div className="h-4 bg-gray-200 rounded animate-pulse w-16" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredTransactions.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Receipt className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions found</h3>
                  <p className="text-gray-600">Transaction history will appear here once you start making payments</p>
                </CardContent>
              </Card>
            ) : (
              filteredTransactions.map((transaction) => (
                <Card key={transaction.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="flex-shrink-0 mt-1">
                          {getTransactionIcon(transaction.type, transaction.status)}
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-gray-900" data-testid={`transaction-description-${transaction.id}`}>
                              {getTypeLabel(transaction.type)}
                            </h3>
                            <Badge className={getStatusColor(transaction.status)}>
                              {transaction.status}
                            </Badge>
                            <span className="text-sm text-gray-500">#{transaction.reference}</span>
                          </div>
                          
                          <p className="text-gray-700 mb-3">{transaction.description}</p>
                          
                          {/* Transaction Details */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-4">
                            <div>
                              <p className="text-gray-500">Date & Time</p>
                              <p className="font-medium">{new Date(transaction.date).toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Payment Method</p>
                              <div className="flex items-center gap-1 font-medium">
                                {getPaymentMethodIcon(transaction.paymentMethod.type)}
                                <span>{formatPaymentMethod(transaction.paymentMethod)}</span>
                              </div>
                            </div>
                            <div>
                              <p className="text-gray-500">Fees</p>
                              <p className="font-medium">${transaction.fees.totalFees.toFixed(2)}</p>
                            </div>
                          </div>

                          {/* Freelancer & Project Info */}
                          {(transaction.freelancer || transaction.project) && (
                            <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg mb-4">
                              {transaction.freelancer && (
                                <div className="flex items-center gap-2">
                                  <Avatar className="w-8 h-8">
                                    <AvatarImage src={transaction.freelancer.profilePhoto} />
                                    <AvatarFallback className="text-xs">
                                      {transaction.freelancer.firstName[0]}{transaction.freelancer.lastName[0]}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <Link href={`/freelancers/${transaction.freelancer.id}`} className="text-sm font-medium text-blue-600 hover:underline">
                                      {transaction.freelancer.firstName} {transaction.freelancer.lastName}
                                    </Link>
                                    <p className="text-xs text-gray-500">ID: {transaction.freelancer.employeeId}</p>
                                  </div>
                                </div>
                              )}
                              
                              {transaction.project && (
                                <div>
                                  <Link href={`/client/projects/${transaction.project.id}`} className="text-sm font-medium text-blue-600 hover:underline">
                                    {transaction.project.title}
                                  </Link>
                                  {transaction.metadata.workHours && (
                                    <p className="text-xs text-gray-500">{transaction.metadata.workHours}h work</p>
                                  )}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Fee Breakdown */}
                          {transaction.fees.totalFees > 0 && (
                            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-4">
                              <h4 className="font-medium text-purple-800 mb-2">Fee Breakdown</h4>
                              <div className="grid grid-cols-2 gap-2 text-sm">
                                <div className="flex justify-between text-purple-700">
                                  <span>Signedwork Fee (2%):</span>
                                  <span>${transaction.fees.signedworkFee.toFixed(2)}</span>
                                </div>
                                {transaction.fees.processingFee > 0 && (
                                  <div className="flex justify-between text-purple-700">
                                    <span>Processing Fee:</span>
                                    <span>${transaction.fees.processingFee.toFixed(2)}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Metadata */}
                          {transaction.metadata.milestone && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
                              <div className="flex items-center gap-2 text-blue-800">
                                <CheckCircle className="w-4 h-4" />
                                <span className="font-medium">Milestone: {transaction.metadata.milestone}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="text-right ml-4">
                        <div className={`text-2xl font-bold ${
                          transaction.type === 'payment_sent' || transaction.type === 'fee' || transaction.type === 'withdrawal' 
                            ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {transaction.type === 'payment_sent' || transaction.type === 'fee' || transaction.type === 'withdrawal' ? '-' : '+'}
                          ${transaction.amount.toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-600">{transaction.currency}</div>

                        <div className="mt-3 space-y-2">
                          {transaction.receiptUrl && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="w-full"
                              onClick={() => downloadReceiptMutation.mutate(transaction.id)}
                              data-testid={`button-receipt-${transaction.id}`}
                            >
                              <Receipt className="w-4 h-4 mr-1" />
                              Receipt
                            </Button>
                          )}
                          
                          {transaction.invoiceId && (
                            <Link href={`/client/invoices/${transaction.invoiceId}`}>
                              <Button variant="outline" size="sm" className="w-full" data-testid={`button-invoice-${transaction.id}`}>
                                <FileText className="w-4 h-4 mr-1" />
                                Invoice
                              </Button>
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
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
                <h3 className="font-semibold text-green-900">Signedwork Transparent Pricing</h3>
                <p className="text-green-700">Only 2% flat fee vs competitors' 0-15% variable rates</p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="text-green-800">
                <strong>No Hidden Fees:</strong> All costs upfront
              </div>
              <div className="text-green-800">
                <strong>Verified Payments:</strong> Fraud-proof work verification
              </div>
              <div className="text-green-800">
                <strong>Instant Processing:</strong> Real-time transaction updates
              </div>
              <div className="text-green-800">
                <strong>Complete Transparency:</strong> Full transaction history
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}