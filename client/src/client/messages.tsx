import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  MessageSquare,
  Search,
  Filter,
  Send,
  Paperclip,
  MoreVertical,
  Archive,
  Star,
  StarOff,
  Trash2,
  Users,
  Clock,
  CheckCircle,
  Eye,
  EyeOff,
  Plus,
  Shield,
  Award,
  File,
  Image,
  Download
} from "lucide-react";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import ClientNavHeader from "@/components/client-nav-header";

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: string;
  readAt?: string;
  attachments?: {
    id: string;
    name: string;
    type: string;
    size: number;
    url: string;
  }[];
  type: 'text' | 'system' | 'file' | 'offer' | 'contract';
  metadata?: {
    contractId?: string;
    projectId?: string;
    offerId?: string;
  };
}

interface Conversation {
  id: string;
  participantId: string;
  participant: {
    id: string;
    firstName: string;
    lastName: string;
    profilePhoto?: string;
    title: string;
    verificationLevel: 'verified' | 'company_verified' | 'basic';
    isOnline: boolean;
    lastSeen: string;
    employeeId: string;
  };
  lastMessage: {
    content: string;
    timestamp: string;
    senderId: string;
  };
  unreadCount: number;
  isStarred: boolean;
  isArchived: boolean;
  project?: {
    id: string;
    title: string;
  };
}

export default function Messages() {
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [newMessage, setNewMessage] = useState("");
  const [showComposeDialog, setShowComposeDialog] = useState(false);
  const [newConversationTo, setNewConversationTo] = useState("");
  const [newConversationSubject, setNewConversationSubject] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch conversations
  const { data: conversations = [], isLoading: conversationsLoading } = useQuery({
    queryKey: ["/api/client/messages/conversations", { filter: filterType, search: searchTerm }],
  });

  // Fetch messages for selected conversation
  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ["/api/client/messages", selectedConversation],
    enabled: !!selectedConversation,
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({ conversationId, content, attachments }: { 
      conversationId: string; 
      content: string; 
      attachments?: File[] 
    }) => {
      return apiRequest("POST", "/api/client/messages/send", { 
        conversationId, 
        content, 
        attachments 
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/client/messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/client/messages/conversations"] });
      setNewMessage("");
      toast({ title: "Message sent successfully" });
    },
  });

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (conversationId: string) => {
      return apiRequest("PATCH", `/api/client/messages/conversations/${conversationId}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/client/messages/conversations"] });
    },
  });

  // Mock data for demonstration
  const mockConversations: Conversation[] = [
    {
      id: "conv1",
      participantId: "freelancer1",
      participant: {
        id: "freelancer1",
        firstName: "Sarah",
        lastName: "Johnson",
        profilePhoto: "",
        title: "Senior React Developer",
        verificationLevel: "verified",
        isOnline: true,
        lastSeen: "2 minutes ago",
        employeeId: "EMP-ABC123"
      },
      lastMessage: {
        content: "I've completed the payment integration and it's ready for testing. Could you please review?",
        timestamp: "2024-01-20T15:30:00Z",
        senderId: "freelancer1"
      },
      unreadCount: 2,
      isStarred: true,
      isArchived: false,
      project: {
        id: "project1",
        title: "React E-commerce Platform"
      }
    },
    {
      id: "conv2",
      participantId: "freelancer2",
      participant: {
        id: "freelancer2",
        firstName: "Michael",
        lastName: "Chen",
        profilePhoto: "",
        title: "Senior UI/UX Designer",
        verificationLevel: "company_verified",
        isOnline: false,
        lastSeen: "5 hours ago",
        employeeId: "EMP-DEF456"
      },
      lastMessage: {
        content: "Thank you for the feedback on the mobile designs. I'll incorporate those changes today.",
        timestamp: "2024-01-19T14:20:00Z",
        senderId: "freelancer2"
      },
      unreadCount: 0,
      isStarred: false,
      isArchived: false,
      project: {
        id: "project2",
        title: "Mobile App Design"
      }
    }
  ];

  const mockMessages: Message[] = [
    {
      id: "msg1",
      conversationId: "conv1",
      senderId: "client1",
      receiverId: "freelancer1",
      content: "Hi Sarah! How's the progress on the payment integration?",
      timestamp: "2024-01-20T14:00:00Z",
      readAt: "2024-01-20T14:05:00Z",
      type: "text"
    },
    {
      id: "msg2",
      conversationId: "conv1",
      senderId: "freelancer1",
      receiverId: "client1",
      content: "Hi! It's going well. I've integrated Razorpay and the basic payment flow is working. Currently working on error handling and validation.",
      timestamp: "2024-01-20T14:10:00Z",
      readAt: "2024-01-20T14:12:00Z",
      type: "text"
    },
    {
      id: "msg3",
      conversationId: "conv1",
      senderId: "freelancer1",
      receiverId: "client1",
      content: "I've completed the payment integration and it's ready for testing. Could you please review?",
      timestamp: "2024-01-20T15:30:00Z",
      type: "text",
      attachments: [
        {
          id: "att1",
          name: "payment-integration-demo.mp4",
          type: "video/mp4",
          size: 15728640,
          url: "/attachments/payment-demo.mp4"
        }
      ]
    }
  ];

  const getVerificationBadge = (level: string) => {
    switch (level) {
      case 'verified':
        return (
          <Badge className="bg-green-100 text-green-800 flex items-center gap-1 text-xs">
            <Shield className="w-3 h-3" />
            Verified ⭐⭐⭐
          </Badge>
        );
      case 'company_verified':
        return (
          <Badge className="bg-blue-100 text-blue-800 flex items-center gap-1 text-xs">
            <Award className="w-3 h-3" />
            Company Verified ⭐⭐
          </Badge>
        );
      default:
        return null;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image className="w-4 h-4" />;
    if (type.startsWith('video/')) return <File className="w-4 h-4" />;
    return <File className="w-4 h-4" />;
  };

  const handleSendMessage = () => {
    if (newMessage.trim() && selectedConversation) {
      sendMessageMutation.mutate({
        conversationId: selectedConversation,
        content: newMessage.trim()
      });
    }
  };

  const handleConversationSelect = (conversationId: string) => {
    setSelectedConversation(conversationId);
    const conversation = mockConversations.find(c => c.id === conversationId);
    if (conversation && conversation.unreadCount > 0) {
      markAsReadMutation.mutate(conversationId);
    }
  };

  const filteredConversations = mockConversations.filter(conversation => {
    const matchesSearch = conversation.participant.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         conversation.participant.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         conversation.lastMessage.content.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterType === "all" || 
                         (filterType === "unread" && conversation.unreadCount > 0) ||
                         (filterType === "starred" && conversation.isStarred) ||
                         (filterType === "archived" && conversation.isArchived);
    
    return matchesSearch && matchesFilter;
  });

  const selectedConv = mockConversations.find(c => c.id === selectedConversation);
  const totalUnread = mockConversations.reduce((sum, conv) => sum + conv.unreadCount, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <ClientNavHeader />
      
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex gap-6 h-[calc(100vh-200px)]">
          {/* Conversations List */}
          <div className="w-80 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-900" data-testid="page-title">
                Messages {totalUnread > 0 && (
                  <Badge className="ml-2 bg-red-100 text-red-800">{totalUnread}</Badge>
                )}
              </h1>
              <Dialog open={showComposeDialog} onOpenChange={setShowComposeDialog}>
                <DialogTrigger asChild>
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700" data-testid="button-compose">
                    <Plus className="w-4 h-4 mr-1" />
                    Compose
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>New Message</DialogTitle>
                    <DialogDescription>
                      Start a new conversation with a freelancer
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">To</label>
                      <Input
                        placeholder="Freelancer name or ID"
                        value={newConversationTo}
                        onChange={(e) => setNewConversationTo(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Subject</label>
                      <Input
                        placeholder="Message subject"
                        value={newConversationSubject}
                        onChange={(e) => setNewConversationSubject(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Message</label>
                      <Textarea
                        placeholder="Type your message..."
                        className="min-h-[100px]"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowComposeDialog(false)}>
                      Cancel
                    </Button>
                    <Button>Send Message</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {/* Search and Filters */}
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search conversations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="search-conversations"
                />
              </div>
              
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger data-testid="filter-conversations">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Conversations</SelectItem>
                  <SelectItem value="unread">Unread ({totalUnread})</SelectItem>
                  <SelectItem value="starred">Starred</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Conversations */}
            <ScrollArea className="h-[calc(100vh-350px)]">
              <div className="space-y-2">
                {filteredConversations.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600">No conversations found</p>
                  </div>
                ) : (
                  filteredConversations.map((conversation) => (
                    <Card 
                      key={conversation.id}
                      className={`cursor-pointer transition-colors hover:bg-gray-50 ${
                        selectedConversation === conversation.id ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                      }`}
                      onClick={() => handleConversationSelect(conversation.id)}
                      data-testid={`conversation-${conversation.id}`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="relative">
                            <Avatar className="w-10 h-10">
                              <AvatarImage src={conversation.participant.profilePhoto} />
                              <AvatarFallback>
                                {conversation.participant.firstName[0]}{conversation.participant.lastName[0]}
                              </AvatarFallback>
                            </Avatar>
                            {conversation.participant.isOnline && (
                              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2">
                                <h3 className="font-medium text-gray-900 truncate">
                                  {conversation.participant.firstName} {conversation.participant.lastName}
                                </h3>
                                {conversation.isStarred && <Star className="w-3 h-3 text-yellow-500" />}
                              </div>
                              <div className="flex items-center gap-1">
                                {conversation.unreadCount > 0 && (
                                  <Badge className="bg-blue-600 text-white text-xs">
                                    {conversation.unreadCount}
                                  </Badge>
                                )}
                                <span className="text-xs text-gray-500">
                                  {new Date(conversation.lastMessage.timestamp).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs text-gray-600">{conversation.participant.title}</span>
                              {getVerificationBadge(conversation.participant.verificationLevel)}
                            </div>
                            
                            {conversation.project && (
                              <p className="text-xs text-blue-600 mb-1">
                                Project: {conversation.project.title}
                              </p>
                            )}
                            
                            <p className="text-sm text-gray-600 truncate">
                              {conversation.lastMessage.content}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Messages Panel */}
          <div className="flex-1 flex flex-col">
            {selectedConv ? (
              <>
                {/* Header */}
                <Card className="mb-4">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={selectedConv.participant.profilePhoto} />
                          <AvatarFallback>
                            {selectedConv.participant.firstName[0]}{selectedConv.participant.lastName[0]}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div>
                          <div className="flex items-center gap-2">
                            <h2 className="font-semibold text-gray-900">
                              {selectedConv.participant.firstName} {selectedConv.participant.lastName}
                            </h2>
                            {getVerificationBadge(selectedConv.participant.verificationLevel)}
                            {selectedConv.participant.isOnline ? (
                              <Badge className="bg-green-100 text-green-800 text-xs">Online</Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs">
                                Last seen {selectedConv.participant.lastSeen}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <span>{selectedConv.participant.title}</span>
                            <span>•</span>
                            <span>ID: {selectedConv.participant.employeeId}</span>
                            {selectedConv.project && (
                              <>
                                <span>•</span>
                                <Link href={`/client/projects/${selectedConv.project.id}`} className="text-blue-600 hover:underline">
                                  {selectedConv.project.title}
                                </Link>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Messages */}
                <Card className="flex-1 flex flex-col">
                  <ScrollArea className="flex-1 p-4">
                    <div className="space-y-4">
                      {mockMessages.map((message) => {
                        const isOwnMessage = message.senderId === 'client1';
                        
                        return (
                          <div
                            key={message.id}
                            className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                          >
                            <div className={`max-w-xs lg:max-w-md xl:max-w-lg ${
                              isOwnMessage
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-200 text-gray-900'
                            } rounded-lg p-3`}>
                              <p className="text-sm">{message.content}</p>
                              
                              {message.attachments && message.attachments.length > 0 && (
                                <div className="mt-2 space-y-2">
                                  {message.attachments.map((attachment) => (
                                    <div
                                      key={attachment.id}
                                      className={`flex items-center gap-2 p-2 rounded ${
                                        isOwnMessage ? 'bg-blue-700' : 'bg-gray-300'
                                      }`}
                                    >
                                      {getFileIcon(attachment.type)}
                                      <div className="flex-1 min-w-0">
                                        <p className="text-xs font-medium truncate">{attachment.name}</p>
                                        <p className="text-xs opacity-75">{formatFileSize(attachment.size)}</p>
                                      </div>
                                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                        <Download className="w-3 h-3" />
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              )}
                              
                              <div className="flex items-center justify-between mt-2">
                                <span className="text-xs opacity-75">
                                  {new Date(message.timestamp).toLocaleTimeString()}
                                </span>
                                {isOwnMessage && message.readAt && (
                                  <CheckCircle className="w-3 h-3 opacity-75" />
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>

                  {/* Message Input */}
                  <div className="border-t p-4">
                    <div className="flex items-end gap-2">
                      <Button variant="outline" size="sm" className="mb-2">
                        <Paperclip className="w-4 h-4" />
                      </Button>
                      
                      <div className="flex-1">
                        <Textarea
                          placeholder="Type your message..."
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          className="min-h-[80px] resize-none"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleSendMessage();
                            }
                          }}
                          data-testid="message-input"
                        />
                      </div>
                      
                      <Button 
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim() || sendMessageMutation.isPending}
                        className="mb-2"
                        data-testid="button-send-message"
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    {/* Quick Actions */}
                    <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                      <span>Press Enter to send, Shift + Enter for new line</span>
                    </div>
                  </div>
                </Card>
              </>
            ) : (
              <Card className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Select a conversation</h3>
                  <p className="text-gray-600">Choose a conversation from the left to start messaging</p>
                </div>
              </Card>
            )}
          </div>
        </div>

        {/* Signedwork Advantage */}
        <Card className="bg-green-50 border-green-200 mt-6">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-green-900">Signedwork Secure Communication</h3>
                <p className="text-green-700">End-to-end encrypted messaging with verified freelancer identities</p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="text-green-800">
                <strong>Verified Identity:</strong> All freelancers undergo multi-level verification
              </div>
              <div className="text-green-800">
                <strong>Secure Communication:</strong> End-to-end encryption for all messages
              </div>
              <div className="text-green-800">
                <strong>Project Context:</strong> Messages automatically linked to relevant projects
              </div>
              <div className="text-green-800">
                <strong>Audit Trail:</strong> Complete communication history for compliance
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}