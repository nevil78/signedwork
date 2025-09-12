import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';

export function useSocket(userId?: string) {
  const socketRef = useRef<Socket | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId) return;

    // Initialize socket connection
    socketRef.current = io('/', {
      transports: ['websocket', 'polling']
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      console.log('Connected to server');
      // Join user-specific room
      socket.emit('join-user-room', userId);
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from server');
    });

    // Listen for work entry events
    socket.on('work-entry-created', (data) => {
      console.log('New work entry created:', data);
      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/work-entries'] });
      queryClient.invalidateQueries({ queryKey: ['/api/company/work-entries'] });
      queryClient.invalidateQueries({ queryKey: ['/api/company/work-entries/pending'] });
      
      // Show notification if we're not the creator
      if (data.employeeId !== userId) {
        toast({
          title: "New Work Entry",
          description: `A new work entry "${data.workEntry.title}" has been submitted for review.`,
        });
      }
    });

    socket.on('work-entry-updated', (data) => {
      console.log('Work entry updated:', data);
      queryClient.invalidateQueries({ queryKey: ['/api/work-entries'] });
      queryClient.invalidateQueries({ queryKey: ['/api/company/work-entries'] });
      queryClient.invalidateQueries({ queryKey: ['/api/company/work-entries/pending'] });
      
      // Show notification if we're not the updater
      if (data.employeeId !== userId) {
        toast({
          title: "Work Entry Updated",
          description: `Work entry "${data.workEntry.title}" has been updated and is pending review.`,
        });
      }
    });

    socket.on('work-entry-approved', (data) => {
      console.log('Work entry approved:', data);
      queryClient.invalidateQueries({ queryKey: ['/api/work-entries'] });
      queryClient.invalidateQueries({ queryKey: ['/api/company/work-entries'] });
      queryClient.invalidateQueries({ queryKey: ['/api/work-entries/analytics'] });
      
      // Show notification for employee
      if (data.employeeId === userId) {
        toast({
          title: "Work Entry Approved! ⭐",
          description: `Your work entry "${data.workEntry.title}" has been approved${data.rating ? ` with ${data.rating}/5 stars` : ''}.`,
        });
      }
    });

    socket.on('work-entry-changes-requested', (data) => {
      console.log('Changes requested for work entry:', data);
      queryClient.invalidateQueries({ queryKey: ['/api/work-entries'] });
      queryClient.invalidateQueries({ queryKey: ['/api/company/work-entries'] });
      
      // Show notification for employee
      if (data.employeeId === userId) {
        toast({
          title: "Changes Requested",
          description: `Your work entry "${data.workEntry.title}" needs changes. Please review the feedback.`,
          variant: "destructive",
        });
      }
    });

    socket.on('employee-status-updated', (data) => {
      console.log('Employee status updated:', data);
      
      // Refresh employee companies and related data
      queryClient.invalidateQueries({ queryKey: ['/api/employee-companies'] });
      queryClient.invalidateQueries({ queryKey: ['/api/employee/companies'] });
      queryClient.invalidateQueries({ queryKey: ['/api/work-entries'] });
      queryClient.invalidateQueries({ queryKey: ["/api/employee/summary-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ['/api/employee/me'] });
      
      // Force a complete cache refresh for employee data
      queryClient.refetchQueries({ queryKey: ['/api/employee-companies'] });
      
      // Show notification for employee
      if (data.employeeId === userId) {
        const statusText = data.status === 'active' ? 'reactivated' : 'marked as ex-employee';
        toast({
          title: "Employment Status Updated",
          description: `You have been ${statusText} by the company.`,
          variant: data.status === 'active' ? "default" : "destructive",
        });
      }
    });

    // Listen for company join events
    socket.on('company-join-success', (data) => {
      console.log('Company join success:', data);
      
      // Invalidate all relevant employee queries for immediate update
      queryClient.invalidateQueries({ queryKey: ['/api/employee-companies'] });
      queryClient.invalidateQueries({ queryKey: ['/api/employee/companies'] });
      queryClient.invalidateQueries({ queryKey: ['/api/employee/me'] });
      queryClient.invalidateQueries({ queryKey: ["/api/employee/summary-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/employee/profile"] });
      
      if (data.employeeId === userId) {
        toast({
          title: "Welcome to the team! 🎉",
          description: `You've successfully joined ${data.companyName}.`,
        });
      }
    });

    // Listen for profile update events
    socket.on('employee-profile-updated', (data) => {
      console.log('Employee profile updated:', data);
      
      if (data.employeeId === userId) {
        // Refresh profile and related data
        queryClient.invalidateQueries({ queryKey: ["/api/employee/profile"] });
        queryClient.invalidateQueries({ queryKey: ['/api/employee/me'] });
        queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [userId, queryClient]);

  // Function to join company rooms (for company users)
  const joinCompanyRoom = (companyId: string) => {
    if (socketRef.current) {
      socketRef.current.emit('join-company-room', companyId);
    }
  };

  return {
    socket: socketRef.current,
    joinCompanyRoom
  };
}