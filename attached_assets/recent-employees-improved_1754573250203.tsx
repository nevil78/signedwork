// Improved Recent Employees Component
import React from 'react';
import { Users, Calendar, Mail, ArrowRight } from 'lucide-react';

interface Employee {
  id: string;
  name: string;
  email: string;
  joinedDate: string;
  avatar?: string;
  department?: string;
  position?: string;
}

interface RecentEmployeesProps {
  employees: Employee[];
  onManageAll: () => void;
  maxDisplay?: number;
}

const RecentEmployees: React.FC<RecentEmployeesProps> = ({ 
  employees, 
  onManageAll, 
  maxDisplay = 5 
}) => {
  const displayEmployees = employees.slice(0, maxDisplay);
  const totalCount = employees.length;

  const formatJoinDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Joined today';
    if (diffDays <= 7) return `Joined ${diffDays} days ago`;
    if (diffDays <= 30) return `Joined ${Math.ceil(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="recent-employees-container">
      {/* Header Section */}
      <div className="recent-employees-header">
        <div className="header-left">
          <div className="section-icon">
            <Users size={20} className="icon" />
          </div>
          <div className="section-title-group">
            <h3 className="section-title">Recent Employees</h3>
            <span className="employee-count">({totalCount})</span>
          </div>
        </div>
        <button 
          onClick={onManageAll}
          className="manage-all-button"
          aria-label="Manage all employees"
        >
          <span>Manage All</span>
          <ArrowRight size={16} className="button-icon" />
        </button>
      </div>

      {/* Content Section */}
      <div className="recent-employees-content">
        {displayEmployees.length === 0 ? (
          <div className="empty-state">
            <Users size={48} className="empty-icon" />
            <p className="empty-title">No recent employees</p>
            <p className="empty-description">
              Recently joined employees will appear here
            </p>
          </div>
        ) : (
          <div className="employees-list">
            {displayEmployees.map((employee) => (
              <div key={employee.id} className="employee-card">
                <div className="employee-avatar">
                  {employee.avatar ? (
                    <img 
                      src={employee.avatar} 
                      alt={employee.name}
                      className="avatar-image"
                    />
                  ) : (
                    <div className="avatar-placeholder">
                      {getInitials(employee.name)}
                    </div>
                  )}
                </div>
                
                <div className="employee-info">
                  <div className="employee-main-info">
                    <h4 className="employee-name">{employee.name}</h4>
                    {employee.position && (
                      <span className="employee-position">{employee.position}</span>
                    )}
                  </div>
                  
                  <div className="employee-details">
                    <div className="detail-item">
                      <Mail size={14} className="detail-icon" />
                      <span className="employee-email">{employee.email}</span>
                    </div>
                    
                    <div className="detail-item">
                      <Calendar size={14} className="detail-icon" />
                      <span className="join-date">{formatJoinDate(employee.joinedDate)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Show More Indicator */}
        {totalCount > maxDisplay && (
          <div className="show-more-indicator">
            <button onClick={onManageAll} className="show-more-button">
              View {totalCount - maxDisplay} more employees
            </button>
          </div>
        )}
      </div>

      <style jsx>{`
        .recent-employees-container {
          background: white;
          border-radius: 12px;
          border: 1px solid #e5e7eb;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
          overflow: hidden;
          transition: all 0.2s ease-in-out;
        }

        .recent-employees-container:hover {
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        /* Header Styles */
        .recent-employees-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 24px 16px 24px;
          border-bottom: 1px solid #f3f4f6;
          background: #fafbfc;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .section-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 10px;
          color: white;
        }

        .section-title-group {
          display: flex;
          align-items: baseline;
          gap: 8px;
        }

        .section-title {
          font-size: 18px;
          font-weight: 600;
          color: #111827;
          margin: 0;
          line-height: 1.2;
        }

        .employee-count {
          font-size: 14px;
          font-weight: 500;
          color: #6b7280;
          background: #f3f4f6;
          padding: 2px 8px;
          border-radius: 12px;
        }

        .manage-all-button {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          color: #475569;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .manage-all-button:hover {
          background: #e2e8f0;
          color: #334155;
          transform: translateY(-1px);
        }

        .button-icon {
          transition: transform 0.2s ease;
        }

        .manage-all-button:hover .button-icon {
          transform: translateX(2px);
        }

        /* Content Styles */
        .recent-employees-content {
          padding: 20px 24px 24px 24px;
        }

        .employees-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .employee-card {
          display: flex;
          align-items: flex-start;
          gap: 16px;
          padding: 16px;
          background: #fafbfc;
          border: 1px solid #f1f5f9;
          border-radius: 10px;
          transition: all 0.2s ease;
          cursor: pointer;
        }

        .employee-card:hover {
          background: #f1f5f9;
          border-color: #e2e8f0;
          transform: translateY(-1px);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        }

        .employee-avatar {
          flex-shrink: 0;
          width: 48px;
          height: 48px;
        }

        .avatar-image {
          width: 100%;
          height: 100%;
          border-radius: 12px;
          object-fit: cover;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .avatar-placeholder {
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 600;
          font-size: 16px;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .employee-info {
          flex: 1;
          min-width: 0;
        }

        .employee-main-info {
          margin-bottom: 8px;
        }

        .employee-name {
          font-size: 16px;
          font-weight: 600;
          color: #111827;
          margin: 0 0 4px 0;
          line-height: 1.3;
        }

        .employee-position {
          font-size: 13px;
          color: #6b7280;
          font-weight: 500;
        }

        .employee-details {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .detail-item {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .detail-icon {
          color: #9ca3af;
          flex-shrink: 0;
        }

        .employee-email {
          font-size: 14px;
          color: #6b7280;
          text-decoration: none;
          transition: color 0.2s ease;
        }

        .employee-card:hover .employee-email {
          color: #4f46e5;
        }

        .join-date {
          font-size: 13px;
          color: #9ca3af;
          font-weight: 500;
        }

        /* Empty State */
        .empty-state {
          text-align: center;
          padding: 40px 20px;
        }

        .empty-icon {
          color: #d1d5db;
          margin-bottom: 16px;
        }

        .empty-title {
          font-size: 16px;
          font-weight: 600;
          color: #374151;
          margin: 0 0 8px 0;
        }

        .empty-description {
          font-size: 14px;
          color: #6b7280;
          margin: 0;
        }

        /* Show More */
        .show-more-indicator {
          margin-top: 16px;
          text-align: center;
        }

        .show-more-button {
          background: none;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 10px 20px;
          color: #6b7280;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .show-more-button:hover {
          background: #f9fafb;
          border-color: #d1d5db;
          color: #374151;
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .recent-employees-header {
            padding: 16px 20px 12px 20px;
          }

          .recent-employees-content {
            padding: 16px 20px 20px 20px;
          }

          .section-title {
            font-size: 16px;
          }

          .manage-all-button {
            padding: 6px 12px;
            font-size: 13px;
          }

          .employee-card {
            padding: 12px;
            gap: 12px;
          }

          .employee-avatar {
            width: 40px;
            height: 40px;
          }

          .avatar-placeholder {
            font-size: 14px;
          }

          .employee-name {
            font-size: 15px;
          }
        }

        @media (max-width: 480px) {
          .recent-employees-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }

          .header-left {
            width: 100%;
          }

          .manage-all-button {
            align-self: flex-end;
          }
        }
      `}</style>
    </div>
  );
};

export default RecentEmployees;

